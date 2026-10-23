import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { API_BASE_URL } from "../Utils/Helpers";

export default function NewPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/password/reset/${token}`, { password, confirmPassword });
      toast.success("Password updated. Please log in.", { position: "bottom-right" });
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaData title="New Password" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Form className="shadow-sm p-4 bg-white rounded" onSubmit={submitHandler}>
              <h2 className="mb-4">New Password</h2>

              <Form.Group className="mb-3" controlId="password_field">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              </Form.Group>

              <Form.Group className="mb-4" controlId="confirm_password_field">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </Form.Group>

              <Button type="submit" className="shop-cta w-100 py-2" disabled={loading}>
                {loading ? <ActionLoader size={18} color="#17332a" /> : "SET PASSWORD"}
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
}s
