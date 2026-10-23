import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { addItemToCart, removeItemFromCart } from "../../actions/cartActions";

const GREEN = "#17332a";
const GREEN_DARK = "#0f241d";
const GOLD = "#c9a227";

const peso = (value) =>
  `₱${Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [pendingItem, setPendingItem] = React.useState(null);

  const increaseQty = async (item) => {
    if (pendingItem) return;
    const newQty = item.quantity + 1;
    if (newQty > item.stock) return;
    setPendingItem(item.product);
    try { await dispatch(addItemToCart(item.product, newQty, item.shade)); } finally { setPendingItem(null); }
  };

  const decreaseQty = async (item) => {
    if (pendingItem) return;
    const newQty = item.quantity - 1;
    if (newQty <= 0) return;
    setPendingItem(item.product);
    try { await dispatch(addItemToCart(item.product, newQty, item.shade)); } finally { setPendingItem(null); }
  };

  const removeHandler = async (item) => {
    if (pendingItem) return;
    setPendingItem(item.product);
    try { await dispatch(removeItemFromCart(item.product, item.shade)); } finally { setPendingItem(null); }
  };

  const checkoutHandler = () => {
    navigate(isAuthenticated ? "/shipping" : "/login?redirect=shipping");
  };

  const units = cartItems.reduce((acc, item) => acc + Number(item.quantity), 0);
  const total = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return (
    <>
      <MetaData title="Your Cart" />
      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, mx: "auto" }}>
        {cartItems.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{ textAlign: "center", py: 8, px: 3, borderRadius: 3 }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Your cart is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add a few products and they will show up here.
            </Typography>
            <Button
              component={Link}
              to="/"
              variant="contained"
              size="large"
              disableElevation
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: GREEN,
                borderBottom: `3px solid ${GOLD}`,
                "&:hover": { bgcolor: GREEN_DARK, color: GOLD },
              }}
            >
              Continue shopping
            </Button>
          </Paper>
        ) : (
          <>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 3, color: GREEN }}>
              Your Cart{" "}
              <Typography component="span" variant="h6" color="text.secondary">
                ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})
              </Typography>
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 340px" },
                gap: 3,
                alignItems: "start",
              }}
            >
              {/* Item list */}
              <Stack spacing={2}>
                {cartItems.map((item) => (
                  <Card
                    variant="outlined"
                    key={`${item.product}-${item.shade || ""}`}
                    sx={{
                      borderRadius: 3,
                      p: 2,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "80px 1fr auto",
                        sm: "88px 1fr auto auto auto",
                      },
                      gridTemplateAreas: {
                        xs: `"thumb info remove" "thumb price qty"`,
                        sm: `"thumb info price qty remove"`,
                      },
                      columnGap: 2,
                      rowGap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        gridArea: "thumb",
                        width: { xs: 80, sm: 88 },
                        height: { xs: 80, sm: 88 },
                        borderRadius: 2,
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {item.image ? (
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.disabled">No image</Typography>
                      )}
                    </Box>

                    <Box sx={{ gridArea: "info", minWidth: 0 }}>
                      <Typography
                        component={Link}
                        to={`/product/${item.product}`}
                        fontWeight={600}
                        color="text.primary"
                        sx={{
                          textDecoration: "none",
                          display: "block",
                          "&:hover": { color: GOLD },
                        }}
                        noWrap
                      >
                        {item.name}
                      </Typography>
                      {item.brand && (
                        <Typography variant="body2" color="text.secondary">
                          {item.brand}
                        </Typography>
                      )}
                      {item.shade && (
                        <Typography variant="body2" color="text.secondary">
                          Shade: {item.shade}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      fontWeight={600}
                      sx={{ gridArea: "price", minWidth: 80, textAlign: { sm: "right" } }}
                    >
                      {peso(item.price)}
                    </Typography>

                    <Box
                      sx={{
                        gridArea: "qty",
                        display: "inline-flex",
                        alignItems: "center",
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        justifySelf: "end",
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => decreaseQty(item)}
                        disabled={item.quantity <= 1 || Boolean(pendingItem)}
                        aria-label="Decrease quantity"
                        sx={{ width: 32, height: 32, color: GREEN, fontSize: 18 }}
                      >
                        {pendingItem === item.product ? <ActionLoader size={20} /> : "−"}
                      </IconButton>
                      <Typography sx={{ minWidth: 28, textAlign: "center" }} fontWeight={600}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => increaseQty(item)}
                        disabled={item.quantity >= item.stock || Boolean(pendingItem)}
                        aria-label="Increase quantity"
                        sx={{ width: 32, height: 32, color: GREEN, fontSize: 18 }}
                      >
                        {pendingItem === item.product ? <ActionLoader size={16} /> : "+"}
                      </IconButton>
                    </Box>

                    <Tooltip title="Remove">
                      <Button
                        onClick={() => removeHandler(item)}
                        disabled={Boolean(pendingItem)}
                        aria-label="Remove item"
                        color="error"
                        size="small"
                        sx={{ gridArea: "remove", justifySelf: "end", textTransform: "none" }}
                      >
                        {pendingItem === item.product ? <ActionLoader size={20} /> : "Remove"}
                      </Button>
                    </Tooltip>
                  </Card>
                ))}
              </Stack>

              {/* Summary */}
              <Paper
                variant="outlined"
                component="aside"
                sx={{
                  borderRadius: 3,
                  p: 3,
                  position: { md: "sticky" },
                  top: { md: 24 },
                }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Order Summary
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <Typography component="span" color="text.secondary">Units</Typography>
                    <Typography component="span" fontWeight={600}>{units}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <Typography component="span" color="text.secondary">Est. total</Typography>
                    <Typography component="span" variant="h6" fontWeight={700} sx={{ color: GREEN }}>
                      {peso(total)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  disableElevation
                  onClick={checkoutHandler}
                  sx={{
                    py: 1.4,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    bgcolor: GREEN,
                    color: "#fff",
                    borderBottom: `3px solid ${GOLD}`,
                    "&:hover": { bgcolor: GREEN_DARK, color: GOLD },
                  }}
                >
                  Check out
                </Button>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", textAlign: "center", mt: 1.5 }}
                >
                  Shipping is calculated at the next step.
                </Typography>
              </Paper>
            </Box>
          </>
        )}
      </Container>
    </>
  );
};

export default Cart;
