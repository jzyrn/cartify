import * as Yup from 'yup'

export const productSchema = Yup.object({
    name: Yup.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters').required('Product name is required'),
    price: Yup.number().typeError('Price must be a number').min(0, 'Price cannot be negative').max(99999, 'Price cannot exceed ₱99,999').required('Price is required'),
    description: Yup.string().trim().min(10, 'Description must be at least 10 characters').required('Description is required'),
    category: Yup.string().oneOf([
        'Foundation',
        'Concealer',
        'Powder',
        'Blush & Highlighter',
        'Eyeshadow',
        'Eyeliner & Mascara',
        'Lipstick & Lip Tint',
        'Brows',
    ], 'Choose a valid category').required('Category is required'),
    brand: Yup.string().trim().min(2, 'Brand must be at least 2 characters').required('Brand is required'),
    stock: Yup.number().typeError('Stock must be a number').integer('Stock must be a whole number').min(0, 'Stock cannot be negative').max(99999, 'Stock cannot exceed 99,999').required('Stock is required'),
    seller: Yup.string().trim().min(2, 'Seller name must be at least 2 characters').required('Seller name is required'),
})

export const loginSchema = Yup.object({
    email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
})

export const registerSchema = Yup.object({
    name: Yup.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name cannot exceed 30 characters').required('Name is required'),
    email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
    password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    confirmPassword: Yup.string()
        .required('Please confirm your password')
        .oneOf([Yup.ref('password')], 'Passwords do not match'),
})

export const profileSchema = Yup.object({
    name: Yup.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name cannot exceed 30 characters').required('Name is required'),
    email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
})

export const adminUserSchema = Yup.object({
    name: Yup.string().trim().min(2, 'Name must be at least 2 characters').max(30, 'Name cannot exceed 30 characters').required('Name is required'),
    email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
    role: Yup.string().oneOf(['user', 'admin'], 'Choose a valid role').required('Role is required'),
})
