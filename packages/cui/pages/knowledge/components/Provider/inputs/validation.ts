import { PropertySchema, PropertyValue } from '../types'

/**
 * Validation result containing error information
 */
export interface ValidationResult {
	isValid: boolean
	error?: string
}

/**
 * Default error message templates
 */
const DEFAULT_ERROR_MESSAGES = {
	required: 'This field is required',
	minLength: 'Must be at least {min} characters long',
	maxLength: 'Must be no more than {max} characters long',
	pattern: 'Invalid format',
	minimum: 'Must be at least {min}',
	maximum: 'Must be no more than {max}',
	custom: 'Invalid value'
}

/**
 * Interpolate variables in error message templates
 */
function interpolateMessage(template: string, variables: Record<string, any>): string {
	return template.replace(/\{(\w+)\}/g, (match, key) => {
		return variables[key] !== undefined ? String(variables[key]) : match
	})
}

/**
 * Validate a field value against its schema
 */
export function validateField(schema: PropertySchema, value: PropertyValue): ValidationResult {
	const errorMessages = { ...DEFAULT_ERROR_MESSAGES, ...schema.errorMessages }

	// Check required
	if (schema.required) {
		if (value === undefined || value === null || value === '') {
			return {
				isValid: false,
				error: errorMessages.required
			}
		}
		// For arrays, check if empty
		if (Array.isArray(value) && value.length === 0) {
			return {
				isValid: false,
				error: errorMessages.required
			}
		}
	}

	// If value is empty and not required, it's valid
	if (value === undefined || value === null || value === '') {
		return { isValid: true }
	}

	const stringValue = String(value)
	const numericValue = Number(value)

	// String validations
	if (schema.type === 'string' || typeof value === 'string') {
		// Min length
		if (schema.minLength !== undefined && stringValue.length < schema.minLength) {
			return {
				isValid: false,
				error: interpolateMessage(errorMessages.minLength!, { min: schema.minLength })
			}
		}

		// Max length
		if (schema.maxLength !== undefined && stringValue.length > schema.maxLength) {
			return {
				isValid: false,
				error: interpolateMessage(errorMessages.maxLength!, { max: schema.maxLength })
			}
		}

		// Pattern
		if (schema.pattern) {
			const regex = new RegExp(schema.pattern)
			if (!regex.test(stringValue)) {
				return {
					isValid: false,
					error: errorMessages.pattern
				}
			}
		}
	}

	// Numeric validations
	if (schema.type === 'number' || schema.type === 'integer') {
		if (!isNaN(numericValue)) {
			// Minimum
			if (schema.minimum !== undefined && numericValue < schema.minimum) {
				return {
					isValid: false,
					error: interpolateMessage(errorMessages.minimum!, { min: schema.minimum })
				}
			}

			// Maximum
			if (schema.maximum !== undefined && numericValue > schema.maximum) {
				return {
					isValid: false,
					error: interpolateMessage(errorMessages.maximum!, { max: schema.maximum })
				}
			}
		}
	}

	return { isValid: true }
}

/**
 * Get error CSS classes for styling
 */
export function getErrorClasses(hasError?: boolean): string {
	return hasError ? 'error' : ''
}
