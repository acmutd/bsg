"use client";
import React from "react";
import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import Link from "next/link";
import {Separator} from "@/components/ui/separator";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGithub, faGoogle} from "@fortawesome/free-brands-svg-icons";
import useSignUpForm from "@/components/customComponents/signUpForm/useSignUpForm";
import {IconProp} from "@fortawesome/fontawesome-svg-core";

const SignUpForm = () => {
    const {form, onSubmit} = useSignUpForm();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <div className={'space-y-3'}>
                    <div className={'flex justify-center'}>
                        <p className={'text-4xl mb-6 font-medium'}>Sign Up</p>
                    </div>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter email..." {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="username"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter username..." {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter password..." {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="Confirm password..." {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Link href={'/dashboard'}>
                        <Button className={'w-full mt-6'} type="submit">Continue</Button>
                    </Link>
                    <div className={'flex justify-center flex-row'}>
                        <p className={''}>Already have an account?</p>
                        <Link href={'/auth/logIn'}>
                            <p className={'ml-2 text-primary hover:underline'}>Log In</p>
                        </Link>
                    </div>
                    <div className={'flex flex-row items-center justify-center'}>
                        <Separator className={'mr-3 w-5/12'}/>
                        <p className={'text-brand'}>or</p>
                        <Separator className={'ml-3 w-5/12'}/>
                    </div>
                    <div className={'flex justify-center flex-row'}>
                        <button onClick={() => {
                        }}>
                            <FontAwesomeIcon icon={faGoogle as IconProp} className={'pr-5'} size={'3x'}
                                             color={'#ACACAC'}/>
                        </button>
                        <button onClick={() => {
                        }}>
                            <FontAwesomeIcon icon={faGithub as IconProp} className={'pl-5'} size={'3x'}
                                             color={'#ACACAC'}/>
                        </button>
                    </div>
                </div>

            </form>
        </Form>
    );
};

export default SignUpForm;
