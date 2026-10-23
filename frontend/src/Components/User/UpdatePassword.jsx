import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import axios from "axios";
import { toast } from "react-toastify";
import MetaData from "../Layout/MetaData";
import { ActionLoader } from "../Layout/Loader";
import { API_BASE_URL, authConfig, authenticate, getUser } from "../Utils/Helpers";

export default function UpdatePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!getUser()) navigate("/login", { replace: true });
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.put(
        `${API_BASE_URL}/password/update`,
        { oldPassword, newPassword },
        authConfig()
      );
      authenticate(data); // backend returns a fresh token
      toast.success("Password updated", { position: "bottom-right" });
      navigate("/me");
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed", { position: "bottom-right" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MetaData title="Change Password" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8} lg={5}>
            <Form className="shadow-sm p-4 bg-white rounded" onSubmit={submitHandler}>
              <h2 className="mb-4">Change Password</h2>

              <Form.Group className="mb-3" controlId="old_password_field">
                <Form.Label>Old Password</Form.Label>
                <Form.Control type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
              </Form.Group>

              <Form.Group className="mb-4" controlId="new_password_field">
                <Form.Label>New Password</Form.Label>
                <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
              </Form.Group>

              <Button type="submit" className="shop-cta w-100 py-2" disabled={loading}>
                {loading ? <ActionLoader size={18} color="#17332a" /> : "UPDATE PASSWORD"}
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  );
}
