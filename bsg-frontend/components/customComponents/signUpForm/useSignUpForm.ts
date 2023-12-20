import * as z from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";

const useSignUpForm = () => {
    const formSchema = z.object({
        email: z.string().email('Invalid email!'),
        username: z.string().min(2, {
            message: "Username must be at least 2 characters.",
        }),
        password: z.string().min(6, {
            message: "Password must be at least 6 characters.",
        }),
        confirmPassword: z.string().min(6, {
            message: "Password must be at least 6 characters.",
        }),
    })
        .refine((data) => data.password === data.confirmPassword, {
            message: "Password doesn't match",
            path: ["confirmPassword"]
        });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = () => {
        console.log('form submitted')
    }

    return {
        form,
        onSubmit,
    };
};

export default useSignUpForm;
