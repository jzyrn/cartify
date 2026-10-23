import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Alert, Box, Button, Paper, Rating, TextField, Typography } from "@mui/material";
import Loader, { ActionLoader } from "../Layout/Loader";
import MetaData from "../Layout/MetaData";
import { getProductDetails, clearErrors, newReview, getReviewEligibility } from "../../actions/productActions";
import { addItemToCart } from "../../actions/cartActions";

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, error, product } = useSelector((state) => state.productDetails);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const [shade, setShade] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [canReview, setCanReview] = useState(false);
  const [checkingReviewAccess, setCheckingReviewAccess] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const reviews = product.reviews || [];
  const userReview = reviews.find((review) =>
    String(review.user?._id || review.user) === String(user?._id)
  );

  useEffect(() => {
    dispatch(getProductDetails(id));
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (location.hash !== "#reviews" || loading || product._id !== id) return;
    requestAnimationFrame(() => {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash, loading, product._id, id]);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !product._id) {
      setCanReview(false);
      setCheckingReviewAccess(false);
      return () => { active = false; };
    }

    setCheckingReviewAccess(true);
    getReviewEligibility(product._id).then((result) => {
      if (!active) return;
      setCanReview(Boolean(result?.canReview));
      setCheckingReviewAccess(false);
    });

    return () => { active = false; };
  }, [isAuthenticated, product._id]);

  useEffect(() => {
    setReviewRating(userReview?.rating || 0);
    setReviewComment(userReview?.comment || "");
  }, [userReview?._id, userReview?.rating, userReview?.comment]);

  if (error) {
    return (
      <Container className="py-5">
        <p>{error}</p>
        <Link to="/">Back to shop</Link>
      </Container>
    );
  }

  // wait until the loaded product is the one in the URL
  if (loading || product._id !== id) return <Loader />;

  const hasShades = product.shades && product.shades.length > 0;

  const addToCartHandler = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to add items to your cart", { position: "bottom-right" });
      navigate(`/login?redirect=/product/${product._id}`);
      return;
    }

    if (hasShades && !shade) {
      return toast.error("Please choose a shade", { position: "bottom-right" });
    }
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      const added = await dispatch(addItemToCart(product._id, quantity, shade));
      if (added) toast.success("Cart updated", { position: "bottom-right" });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not update your cart.", { position: "bottom-right" });
    } finally {
      setAddingToCart(false);
    }
  };

  const submitReviewHandler = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${product._id}`);
      return;
    }
    if (!canReview) {
      toast.info("Reviews are available after your order is delivered.", { position: "bottom-right" });
      return;
    }
    if (!reviewRating || !reviewComment.trim()) {
      toast.error("Choose a rating and write a short review.", { position: "bottom-right" });
      return;
    }

    setSubmittingReview(true);
    const result = await dispatch(newReview({
      productId: product._id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    }));
    setSubmittingReview(false);

    if (result?.success) {
      toast.success(result.message || "Your review has been saved.", { position: "bottom-right" });
      dispatch(getProductDetails(product._id));
    } else {
      toast.error(result?.message || "Could not save your review.", { position: "bottom-right" });
    }
  };

  return (
    <>
      <MetaData title={product.name} />
      <Container className="py-5">
        <Link to="/" className="cartify-details-back">&larr; Back to shop</Link>

        <Row className="mt-3">
          <Col md={5} className="mb-4">
            <div className="cartify-details-image">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0].url} alt={product.name} />
              ) : (
                <i className="fa fa-shopping-bag" />
              )}
            </div>
          </Col>

          <Col md={7}>
            <p className="cartify-details-meta">{product.category}</p>
            <h1 className="cartify-details-name">{product.name}</h1>
            <p className="cartify-details-brand">{product.brand}</p>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <Rating value={Number(product.ratings || 0)} precision={0.5} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {Number(product.ratings || 0).toFixed(1)} ({product.numOfReviews || reviews.length} reviews)
              </Typography>
            </Box>
            <p className="cartify-details-price">₱{product.price}</p>
            <p className="cartify-details-desc">{product.description}</p>

            {hasShades && (
              <div className="mb-3">
                <strong>Shade:</strong> {shade || "Select one"}
                <div className="cartify-shades">
                  {product.shades.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={"cartify-shade" + (s === shade ? " active" : "")}
                      onClick={() => setShade(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mb-3">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>

            {product.stock > 0 && (
              <div className="cartify-details-actions">
                <div className="cartify-qty">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
                <button type="button" className="cartify-btn primary" onClick={addToCartHandler} disabled={addingToCart}>
                  {addingToCart ? <><ActionLoader size={20} color="#fff" />Adding…</> : "Add to Cart"}
                </button>
              </div>
            )}
          </Col>
        </Row>

        <Box id="reviews" sx={{ mt: { xs: 4, md: 6 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 3 }}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderColor: "#e2e8e4", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: "#1a3329", mb: 0.5 }}>
              {userReview ? "Update your review" : "Rate this product"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Reviews are available to customers after their order is delivered.
            </Typography>

            {!isAuthenticated ? (
              <Button component={Link} to={`/login?redirect=/product/${product._id}`} variant="outlined" sx={{ textTransform: "none", color: "#1a3329", borderColor: "#1a3329" }}>
                Sign in to review
              </Button>
            ) : checkingReviewAccess ? (
              <Typography variant="body2" color="text.secondary">Checking purchase eligibility…</Typography>
            ) : canReview ? (
              <Box component="form" onSubmit={submitReviewHandler}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <Rating
                    name="product-review-rating"
                    value={reviewRating}
                    onChange={(_, value) => setReviewRating(value || 0)}
                    precision={1}
                  />
                  <Typography variant="body2" color="text.secondary">{reviewRating ? `${reviewRating} out of 5` : "Choose a rating"}</Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Your review"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value.slice(0, 1000))}
                  placeholder="What did you think of this product?"
                  inputProps={{ maxLength: 1000 }}
                  sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained" disabled={submittingReview} sx={{ bgcolor: "#1a3329", textTransform: "none", fontWeight: 700, "&:hover": { bgcolor: "#12241c" } }}>
                  {submittingReview ? <><ActionLoader size={20} color="#fff" />Saving…</> : userReview ? "Update review" : "Submit review"}
                </Button>
              </Box>
            ) : (
              <Alert severity="info">You can leave a review after this product has been delivered to you.</Alert>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderColor: "#e2e8e4", borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} sx={{ color: "#1a3329", mb: 2 }}>
              Customer reviews
            </Typography>
            {reviews.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No reviews yet. Be the first verified customer to share your experience.</Typography>
            ) : (
              <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
                {reviews.map((review) => (
                  <Box key={review._id} sx={{ py: 1.5, borderBottom: "1px solid #eef3f0", "&:last-child": { borderBottom: 0 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                      <Typography fontWeight={600}>{review.name}</Typography>
                      <Rating value={Number(review.rating || 0)} readOnly size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                      {review.comment}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Container>
    </>
  );
}
