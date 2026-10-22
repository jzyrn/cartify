import React from 'react'
import { Step, StepLabel, Stepper } from '@mui/material'
import { GREEN } from './checkoutUtils'

const STEPS = ['Shipping', 'Confirm order', 'Payment']

// activeStep: 0 = Shipping, 1 = Confirm order, 2 = Payment
const CheckoutSteps = ({ activeStep = 0 }) => (
    <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
            mb: 4,
            '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': { color: GREEN },
            '& .MuiStepLabel-label.Mui-active': { color: GREEN, fontWeight: 700 },
        }}
    >
        {STEPS.map((label) => (
            <Step key={label}>
                <StepLabel>{label}</StepLabel>
            </Step>
        ))}
    </Stepper>
)

export default CheckoutSteps