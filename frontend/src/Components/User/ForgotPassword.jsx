import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { API_BASE_URL } from "../Utils/Helpers";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/password/forgot`, { email });
      toast.success(data.message, { position: "bottom-center" });
      setEmail("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaData title="Forgot Password" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Form className="shadow-sm p-4 bg-white rounded" onSubmit={submitHandler}>
              <h2 className="mb-3">Forgot Password</h2>
              <p className="text-muted">Enter your email and we'll send you a reset link.</p>

              <Form.Group className="mb-4" controlId="email_field">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Form.Group>

              <Button type="submit" className="shop-cta w-100 py-2" disabled={loading}>
                {loading ? <ActionLoader size={18} color="#17332a" /> : "SEND EMAIL"}
              </Button>

              <p className="mt-3 mb-0 text-center"><Link to="/login">Back to login</Link></p>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
}
