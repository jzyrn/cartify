import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import Alert from '@mui/material/Alert'
import axios from 'axios'
import MetaData from '../Layout/MetaData'
import { ActionLoader } from '../Layout/Loader'
import { API_BASE_URL } from '../Utils/Helpers'

const GREEN = '#1a3329'
const GOLD = '#c9a227'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const { data } = await axios.post(`${API_BASE_URL}/password/forgot`, { email })
      setMessage(data.message || 'If an account exists for that email, a reset link has been sent.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <MetaData title="Forgot Password" />
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs={10} lg={5}>
            <Form className="shadow-lg bg-white p-4 rounded" onSubmit={submitHandler}>
              <h1 className="mb-3">Forgot Password</h1>
              <p className="text-muted">Enter your account email and we’ll send you a reset link.</p>

              {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
              {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}

              <Form.Group className="mb-4" controlId="email_field">
                <Form.Label>Enter Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Form.Group>

              <Button
                type="submit"
                className="w-100 py-3"
                disabled={loading}
                style={{ backgroundColor: GREEN, borderColor: GREEN, color: GOLD, fontWeight: 700, letterSpacing: 1 }}
              >
                {loading ? <><ActionLoader size={18} color={GOLD} />Sending…</> : 'SEND EMAIL'}
              </Button>
              <p className="mt-3 mb-0 text-center"><Link to="/login">Back to sign in</Link></p>
            </Form>
          </Col>
        </Row>
      </Container>
    </>
  )
}
