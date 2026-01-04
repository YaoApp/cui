export default () => {
	return (target: unknown, key: string, descriptor: PropertyDescriptor) => {
		const fn = descriptor.value

		// Use regular function to preserve 'this' context
		descriptor.value = async function (...args: any) {
			let res, err

			try {
				res = await fn.apply(this, args)
			} catch (error: any) {
				err = error.response || error
			}

			return { res, err }
		}

		return descriptor
	}
}
