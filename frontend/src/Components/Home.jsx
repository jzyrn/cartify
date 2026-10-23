import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Rating from "@mui/material/Rating";
import Fab from "@mui/material/Fab";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import MetaData from "./Layout/MetaData";
import Loader from "./Layout/Loader";
import { ActionLoader } from "./Layout/Loader";
import { getProducts } from "../actions/productActions";
import { addItemToCart } from "../actions/cartActions";
import cartifyHero from "../assets/cartify_hero_cosmetics.png";

const categories = [
  "Foundation",
  "Concealer",
  "Powder",
  "Blush & Highlighter",
  "Eyeshadow",
  "Eyeliner & Mascara",
  "Lipstick & Lip Tint",
  "Brows",
];

const GREEN = "#1a3329";
const GOLD = "#c9a227";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  let { keyword } = useParams();

  const { loading, products, error, filteredProductsCount } = useSelector(
    (state) => state.products
  );
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [activeCategory, setActiveCategory] = useState("All");
  const [price, setPrice] = useState([1, 1000]); // applied filter (triggers a fetch)
  const [sliderValue, setSliderValue] = useState([1, 1000]); // what the slider shows while dragging
  const [minimumRating, setMinimumRating] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [selectedShade, setSelectedShade] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // every product loaded so far (infinite scroll keeps adding to this list)
  const [allProducts, setAllProducts] = useState([]);

  // invisible element at the bottom of the list; when it scrolls into view, load the next page
  const sentinelRef = useRef(null);
  const prevFilterKey = useRef(null);

  const hasMore =
    filteredProductsCount !== undefined && allProducts.length < filteredProductsCount;
  const visibleProducts = minimumRating === 0
    ? allProducts
    : allProducts.filter((product) => {
        const rating = Number(product.ratings) || 0;
        return minimumRating === 5
          ? rating === 5
          : rating >= minimumRating && rating < minimumRating + 1;
      });

  // fetch a page whenever the page or a filter changes
  useEffect(() => {
    const filterKey = `${keyword || ""}|${activeCategory}|${price[0]}-${price[1]}|${minimumRating}`;

    if (prevFilterKey.current !== null && prevFilterKey.current !== filterKey) {
      // a filter changed: start over from page 1 with an empty list
      prevFilterKey.current = filterKey;
      setAllProducts([]);
      if (currentPage !== 1) {
        setCurrentPage(1); // this effect runs again with page 1
        return;
      }
    }
    prevFilterKey.current = filterKey;

    dispatch(
      getProducts(
        currentPage,
        keyword,
        price,
        activeCategory === "All" ? "" : activeCategory,
        minimumRating
      )
    );
  }, [dispatch, currentPage, keyword, activeCategory, price, minimumRating]);

  // when a page arrives, replace the list (page 1) or add to it (page 2, 3, ...)
  useEffect(() => {
    if (loading || !products) return;
    if (currentPage === 1) {
      setAllProducts(products);
    } else {
      setAllProducts((prev) => {
        const ids = new Set(prev.map((p) => p._id));
        return [...prev, ...products.filter((p) => !ids.has(p._id))];
      });
    }
  }, [products, loading]);

  // infinite scroll: watch the bottom of the list
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // If a rating filter has no matches, don't keep paging through the list.
    if (minimumRating > 0 && visibleProducts.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !error && hasMore) {
          setCurrentPage((page) => page + 1);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, error, hasMore, allProducts.length, minimumRating, visibleProducts.length]);

  const valuetext = (value) => `P${value.toString()}`;

  const openQuickView = (product) => {
    setQuickViewProduct(product);
    setSelectedShade("");
    setSelectedQuantity(1);
  };

  const addQuickViewToCart = async () => {
    if (!quickViewProduct) return;
    const hasShades = quickViewProduct.shades?.length > 0;
    if (hasShades && !selectedShade) {
      toast.error("Please choose a shade", { position: "bottom-right" });
      return;
    }
    if (!isAuthenticated) {
      toast.info("Please log in to add items to your cart", { position: "bottom-right" });
      navigate("/login?redirect=/cart");
      return;
    }

    setAddingToCart(true);
    try {
      const added = await dispatch(
        addItemToCart(quickViewProduct._id, selectedQuantity, selectedShade)
      );
      if (added) {
        toast.success("Added to your cart", { position: "bottom-right" });
        setQuickViewProduct(null);
      } else {
        toast.info("Please log in to add items to your cart", { position: "bottom-right" });
        navigate("/login?redirect=/cart");
      }
    } catch (addError) {
      toast.error(addError.response?.data?.message || "Could not add this product to your cart.", {
        position: "bottom-right",
      });
    } finally {
      setAddingToCart(false);
    }
  };

  const renderCard = (p) => (
    <Col key={p._id} sm={6} lg={4} className="mb-4">
      <div className="shop-card">
        <div className="shop-card-image">
          {p.images && p.images.length > 0 ? (
            <img
              src={p.images[0].url}
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <i className="fa fa-shopping-bag" />
          )}
        </div>
        <div className="shop-card-body">
          <p className="shop-card-category">{p.category}</p>
          <p className="shop-card-brand">{p.brand}</p>
          <h3 className="shop-card-name">{p.name}</h3>

          {/* MUI Rating (read-only) */}
          <Box
            component={Link}
            to={`/product/${p._id}#reviews`}
            aria-label={`View ${p.numOfReviews || 0} reviews for ${p.name}`}
            title="View customer reviews"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1,
              width: "fit-content",
              color: "inherit",
              textDecoration: "none",
              cursor: "pointer",
              "&:hover .MuiTypography-root": { color: GREEN, textDecoration: "underline" },
            }}
          >
            <Rating value={p.ratings || 0} precision={0.5} readOnly size="small" />
            <Typography variant="caption">({p.numOfReviews || 0})</Typography>
          </Box>

          <div className="shop-card-footer">
            <span className="shop-card-price">₱{p.price}</span>
          </div>
          <div className="shop-card-actions">
            <button
              type="button"
              className="shop-card-btn solid"
              onClick={() => openQuickView(p)}
              disabled={p.stock <= 0}
            >
              {p.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
            <Link to={`/product/${p._id}`} className="shop-card-btn outline">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </Col>
  );

  return (
    <div className="shop-page">
      <MetaData title="Cartify - Online Shopping " />

      {!isAuthenticated && !keyword && (
        <section
          className="cartify-guest-hero"
          aria-label="Discover Cartify beauty products"
          style={{
            "--cartify-hero-image": `url(${cartifyHero})`,
          }}
        >
          <Container className="cartify-guest-hero-content">
            <p className="cartify-guest-hero-eyebrow">A little Cartify, a lot of you</p>
            <h1>
              Find your <em>everyday</em> favorite.
            </h1>
            <p className="cartify-guest-hero-copy">
              Explore makeup picks made for your routine, your style, and every
              version of you.
            </p>
            <div className="cartify-guest-hero-actions">
              <a className="cartify-guest-hero-primary" href="#featured-products">
                Explore the collection
              </a>
              <Link className="cartify-guest-hero-secondary" to="/register">
                Join Cartify
              </Link>
            </div>
          </Container>
        </section>
      )}

      {/* MUI Chips as the category filter */}
      <section className="shop-category-rail">
        <Container className="d-flex flex-wrap" style={{ gap: 8 }}>
          {["All", ...categories].map((cat) => {
            const active = cat === activeCategory;
            return (
              <Chip
                key={cat}
                label={cat}
                clickable
                onClick={() => setActiveCategory(cat)}
                sx={{
                  height: 38,
                  fontSize: 15,
                  fontFamily: "inherit",
                  fontWeight: 500,
                  bgcolor: active ? GOLD : "#f7f5f0",
                  color: GREEN,
                  "& .MuiChip-label": { px: "16px" },
                  "&:hover": { bgcolor: active ? GOLD : "#ffffff" },
                }}
              />
            );
          })}
        </Container>
      </section>

      {/* full-page loader only for the very first load of a list */}
      {loading && allProducts.length === 0 && filteredProductsCount === undefined ? (
        <Loader />
      ) : (
        <section className="shop-products" id="featured-products">
          <Container>
            <div className="shop-section-heading">
              <h2>{keyword ? `Results for "${keyword}"` : "Featured products"}</h2>
            </div>

            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 2.5 },
                mb: 4,
                borderColor: "#e5e2d9",
                borderRadius: 2,
                boxShadow: "0 5px 18px rgba(26, 51, 41, 0.04)",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 240px" },
                  columnGap: { xs: 2, sm: 5 },
                  rowGap: 2,
                  alignItems: "center",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: GREEN, fontWeight: 700, mb: 0.25 }}>
                    Price range
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₱{sliderValue[0]} – ₱{sliderValue[1]}
                  </Typography>
                  <Slider
                    getAriaLabel={() => "Price Filter"}
                    value={sliderValue}
                    onChange={(event, newValue) => setSliderValue(newValue)}
                    onChangeCommitted={(event, newValue) => setPrice(newValue)}
                    valueLabelDisplay="auto"
                    getAriaValueText={valuetext}
                    min={1}
                    max={1000}
                    sx={{ color: GREEN, mt: 1, mb: 0, "& .MuiSlider-thumb": { border: `2px solid ${GOLD}` } }}
                  />
                </Box>
                <FormControl size="small" fullWidth>
                  <InputLabel id="review-rating-filter-label">Customer rating</InputLabel>
                  <Select
                    labelId="review-rating-filter-label"
                    id="review-rating-filter"
                    value={minimumRating}
                    label="Customer rating"
                    onChange={(event) => setMinimumRating(Number(event.target.value))}
                    sx={{ borderRadius: 1.5, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: GREEN } }}
                  >
                    <MenuItem value={0}>All reviews</MenuItem>
                    {[4, 3, 2, 1].map((rating) => (
                      <MenuItem key={rating} value={rating}>
                        <Rating value={rating} readOnly size="small" />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            {/* MUI Alerts for errors and empty results */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                Could not load products: {error}
              </Alert>
            )}

            {!error && !loading && visibleProducts.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {minimumRating > 0
                  ? `No ${minimumRating}-star reviews found.`
                  : "No products found. Try a different category or price range."}
              </Alert>
            )}

            {loading && allProducts.length === 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <Loader size={28} fullScreen={false} />
              </Box>
            )}

            <Row>{visibleProducts.map(renderCard)}</Row>

            {/* infinite scroll footer */}
            <div ref={sentinelRef} className="text-center my-4">
              {loading && allProducts.length > 0 && (
                <Loader size={28} fullScreen={false} />
              )}

              {!loading && !hasMore && allProducts.length > 0 && (
                <>
                  <Alert severity="success" sx={{ display: "inline-flex", mb: 2 }}>
                    You've reached the end.
                  </Alert>
                  <div>
                    <Fab
                      size="small"
                      aria-label="Back to top"
                      title="Back to top"
                      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                      sx={{
                        bgcolor: GREEN,
                        color: GOLD,
                        "&:hover": { bgcolor: "#12241c" },
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 19V5" />
                        <path d="M5 12l7-7 7 7" />
                      </svg>
                    </Fab>
                  </div>
                </>
              )}
            </div>
          </Container>
        </section>
      )}

      <Dialog
        open={Boolean(quickViewProduct)}
        onClose={() => !addingToCart && setQuickViewProduct(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="quick-view-title"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
      >
        {quickViewProduct && (
          <>
            <DialogTitle
              id="quick-view-title"
              sx={{ color: GREEN, fontWeight: 700, pr: 7, pb: 0.5 }}
            >
              {quickViewProduct.name}
              <IconButton
                aria-label="Close product details"
                onClick={() => setQuickViewProduct(null)}
                disabled={addingToCart}
                sx={{ position: "absolute", right: 12, top: 10, color: "text.secondary" }}
              >
                <span aria-hidden="true">×</span>
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ borderColor: "#edf0ed" }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
                  gap: 2.5,
                  py: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    borderRadius: 2,
                    bgcolor: "#faecd9",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    color: GREEN,
                  }}
                >
                  {quickViewProduct.images?.[0]?.url ? (
                    <Box
                      component="img"
                      src={quickViewProduct.images[0].url}
                      alt={quickViewProduct.name}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <i className="fa fa-shopping-bag" aria-hidden="true" />
                  )}
                </Box>
                <Box>
                  <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.5 }}>
                    {quickViewProduct.category}
                  </Typography>
                  <Typography variant="body2" sx={{ color: GOLD, fontWeight: 600 }}>
                    {quickViewProduct.brand}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, my: 0.75 }}>
                    <Rating value={Number(quickViewProduct.ratings || 0)} precision={0.5} readOnly size="small" />
                    <Typography variant="caption" color="text.secondary">
                      ({quickViewProduct.numOfReviews || 0} reviews)
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ color: GREEN, fontWeight: 700, mb: 0.75 }}>
                    ₱{Number(quickViewProduct.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {quickViewProduct.description || "A Cartify favorite for your everyday routine."}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {quickViewProduct.stock} in stock
                  </Typography>
                </Box>
              </Box>

              {quickViewProduct.shades?.length > 0 && (
                <Box sx={{ mt: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: GREEN }}>
                    Choose a shade {selectedShade && `· ${selectedShade}`}
                  </Typography>
                  <Box className="cartify-shades">
                    {quickViewProduct.shades.map((shade) => (
                      <button
                        key={shade}
                        type="button"
                        className={`cartify-shade${selectedShade === shade ? " active" : ""}`}
                        aria-pressed={selectedShade === shade}
                        onClick={() => setSelectedShade(shade)}
                      >
                        {shade}
                      </button>
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color: GREEN }}>Quantity</Typography>
                <Box className="cartify-qty">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setSelectedQuantity((quantity) => Math.max(1, quantity - 1))}
                  >−</button>
                  <span>{selectedQuantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={selectedQuantity >= quickViewProduct.stock}
                    onClick={() => setSelectedQuantity((quantity) => Math.min(quickViewProduct.stock, quantity + 1))}
                  >+</button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() => setQuickViewProduct(null)}
                disabled={addingToCart}
                sx={{ color: GREEN, textTransform: "none", fontWeight: 600 }}
              >
                Keep browsing
              </Button>
              <Button
                onClick={addQuickViewToCart}
                variant="contained"
                disabled={addingToCart || quickViewProduct.stock <= 0 || (quickViewProduct.shades?.length > 0 && !selectedShade)}
                sx={{
                  bgcolor: GREEN,
                  borderBottom: `3px solid ${GOLD}`,
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2.5,
                  "&:hover": { bgcolor: "#12241c" },
                }}
              >
                {addingToCart ? <><ActionLoader size={18} color="#fff" />Adding…</> : "Add to Cart"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
