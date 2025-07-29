export default interface Login {
	title: string
	user_login_tip: string
	admin_login_tip: string
	no_entry: string
	auth_lark_err: string
	form: {
		validate: {
			email: string
			mobile: string
			captcha: string
		}
		username_placeholder: string
		password_placeholder: string
		captcha_placeholder: string
		remember_me: string
		forgot_password: string
		register: string
		no_account: string
		login_button: string
		loading: string
	}
	third_party: {
		title: string
		continue_with: string
	}
	theme: {
		light: string
		dark: string
	}
	language: {
		title: string
	}
	welcome: {
		title: string
		subtitle: string
	}
	terms: {
		agreement: string
		terms: string
		and: string
		privacy: string
	}
	captcha: {
		title: string
		refresh: string
		cloudflare: string
	}
}
