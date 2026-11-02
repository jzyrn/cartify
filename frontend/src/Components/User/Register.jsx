import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { register as registerUser, clearErrors } from "../../actions/userActions";
import { registerSchema } from "../../validation/schemas";

const GREEN = "#1a3329";
const GOLD = "#c9a227";

// keeps the MUI inputs in the site's green instead of the default blue
const fieldSx = {
  mb: 2,
  "& label.Mui-focused": { color: GREEN },
  "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN },
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registerSchema),
    mode: "onBlur",
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

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

  const submitHandler = ({ name, email, password }) => {
    setFormError("");
    dispatch(registerUser({ name, email, password }));
  };

  return (
    <>
      <MetaData title="Register" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <form className="shadow-sm p-4 bg-white rounded" onSubmit={handleSubmit(submitHandler)} noValidate>
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
                {...register("name")}
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                id="email_field"
                label="Email"
                type="email"
                {...register("email")}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                fullWidth
                sx={fieldSx}
              />

              <TextField
                id="password_field"
                label="Password"
                type={showPassword ? "text" : "password"}
                {...register("password", { deps: "confirmPassword" })}
                error={Boolean(errors.password)}
                fullWidth
                helperText={errors.password?.message || "At least 6 characters"}
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
                {...register("confirmPassword")}
                error={Boolean(errors.confirmPassword)}
                helperText={errors.confirmPassword?.message || " "}
                fullWidth
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
