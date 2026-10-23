import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { register, clearErrors } from "../../actions/userActions";

const GREEN = "#1a3329";
const GOLD = "#c9a227";

// keeps the MUI inputs in the site's green instead of the default blue
const fieldSx = {
  mb: 2,
  "& label.Mui-focused": { color: GREEN },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN },
};

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const { name, email, password, confirmPassword } = form;
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Account created!", { position: "bottom-right" });
      navigate("/", { replace: true });
    }
    if (error) {
      // shown as a MUI Alert inside the form
      setFormError(error);
      dispatch(clearErrors());
    }
  }, [isAuthenticated, error, dispatch, navigate]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordsMismatch = confirmPassword !== "" && password !== confirmPassword;

  const submitHandler = (e) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    dispatch(register({ name, email, password }));
  };

  return (
    <>
      <MetaData title="Register" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <form className="shadow-sm p-4 bg-white rounded" onSubmit={submitHandler}>
              <h2 className="mb-4">Register</h2>

              {/* MUI Alert replaces the error toasts */}
              {formError && (
                <Alert severity="error" onClose={() => setFormError("")} sx={{ mb: 2 }}>
                  {formError}
                </Alert>
              )}

              <TextField
                id="name_field"
                label="Name"
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                required
                fullWidth
                sx={fieldSx}
              />

              <TextField
                id="email_field"
                label="Email"
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                required
                fullWidth
                sx={fieldSx}
              />

              <TextField
                id="password_field"
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={onChange}
                required
                fullWidth
                helperText="At least 6 characters"
                sx={fieldSx}
                slotProps={{
                  htmlInput: { minLength: 6 },
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={() => setShowPassword((show) => !show)}
                          sx={{ color: GREEN, minWidth: 0 }}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                id="confirm_password_field"
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                required
                fullWidth
                error={passwordsMismatch}
                helperText={passwordsMismatch ? "Passwords do not match" : " "}
                sx={{ ...fieldSx, mb: 3 }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  bgcolor: GREEN,
                  color: GOLD,
                  fontWeight: 700,
                  letterSpacing: 1,
                  py: 1.5,
                  "&:hover": { bgcolor: "#12241c" },
                  "&.Mui-disabled": { bgcolor: "#6b7d74", color: "#e8e1c4" },
                }}
              >
                {loading ? <ActionLoader size={18} color={GOLD} /> : "REGISTER"}
              </Button>

              <p className="mt-3 mb-0 text-center">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          </Col>
        </Row>
      </Container>
    </>
  );
}
