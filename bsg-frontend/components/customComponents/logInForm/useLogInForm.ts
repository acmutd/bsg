import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const useLogInForm = () => {
	const isEmail = z.string().email();

	const formSchema = z.object({
		email: z.string().min(1, { message: 'Name/Email is required' }),
		username: z.string(),
		password: z.string().min(1, { message: 'Password is required' }),
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: '',
			username: '',
			password: '',
		},
	});
	const onSubmit = () => {
		const { email, username } = form.getValues();
		const isEmailValid = isEmail.safeParse(email).success;

		if (isEmailValid) {
			form.setValue('email', email);
			form.setValue('username', '');
		} else {
			form.setValue('username', username);
			form.setValue('email', '');
		}
		console.log('form submitted');
	};

	return {
		form,
		onSubmit,
	};
};
export default useLogInForm;
