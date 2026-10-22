import React from "react";
import { Navbar, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Search from "./Search";
import cartifyLogo from "../../assets/cartify_logo.png";
import { logout } from "../../actions/userActions";
import { clearCart } from "../../actions/cartActions";

/* shared look for every icon in the bar: same size, white, no underline */
const iconLinkStyle = {
  position: "relative",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 40,
  height: 40,
  color: "#fff",
  textDecoration: "none",
  background: "none",
  border: 0,
  padding: 0,
  borderRadius: 8,
  cursor: "pointer",
};
const iconStyle = { fontSize: 20, lineHeight: 1, color: "inherit" };

export function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);

  const logoutHandler = async () => {
    await dispatch(logout());
    dispatch(clearCart());
    localStorage.removeItem("cartItems");
    localStorage.removeItem("shippingInfo");
    toast.success("Logged out", { position: "bottom-right" });
    navigate("/login");
  };

  return (
    <>
      <Navbar expand="lg" className="shop-navbar py-2" variant="dark">
        {/* fluid = full width, so the logo sits at the far left instead of inside a centered box */}
        <Container fluid className="px-3 px-lg-4">
          <Navbar.Brand as={Link} to="/" className="shop-brand me-4 py-0">
            <img
              src={cartifyLogo}
              alt="Cartify"
              className="shop-logo-img"
              style={{ height: 72, width: "auto", display: "block" }}
            />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="shop-nav" />

          <Navbar.Collapse id="shop-nav">
            {/* ms-auto pushes the search + icons to the right edge */}
            <div className="d-flex align-items-center gap-2 gap-lg-3 ms-lg-auto mt-3 mt-lg-0 shop-nav-icons">
              <Search />

              {/* not logged in -> /login link; logged in -> dropdown with the name beside the icon */}
              {isAuthenticated && user ? (
                <NavDropdown
                  align="end"
                  id="user-dropdown"
                  title={
                    <span className="d-inline-flex align-items-center gap-2 text-white">
                      <i className="fa fa-user-o" style={iconStyle} />
                      <span>{user.name}</span>
                    </span>
                  }
                >
                  {user.role === "admin" && (
                    <NavDropdown.Item as={Link} to="/dashboard">
                      Dashboard
                    </NavDropdown.Item>
                  )}
                  <NavDropdown.Item as={Link} to="/me">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/orders/me">
                    My Orders
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <Link to="/login" style={iconLinkStyle} title="Login / Register">
                  <i className="fa fa-user-o" style={iconStyle} />
                </Link>
              )}

              <Link to="/cart" style={iconLinkStyle} title="My bag">
                <i className="fa fa-shopping-bag" style={iconStyle} />
                {cartItems.length > 0 && (
                  <span
                    className="cartify-cart-count"
                    style={{ position: "absolute", top: 2, right: 0 }}
                  >
                    {cartItems.length}
                  </span>
                )}
              </Link>

              {isAuthenticated && user && (
                <button
                  type="button"
                  onClick={logoutHandler}
                  style={iconLinkStyle}
                  title="Logout"
                >
                  <i className="fa fa-sign-out" style={iconStyle} />
                </button>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default Header;