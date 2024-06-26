'use client';
import React from 'react';
import {Button} from '@/components/ui/button';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import Link from 'next/link';
import {Separator} from '@/components/ui/separator';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub, faGoogle} from '@fortawesome/free-brands-svg-icons';
import useLogInForm from '@/components/customComponents/logInForm/useLogInForm';

const LogInForm = () => {
    const {form, onSubmit} = useLogInForm();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                <div className={'space-y-3'}>
                    <div className={'flex justify-center'}>
                        <p className={'text-4xl mb-6 font-black'}>Log In</p>
                    </div>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Email/Username</FormLabel>
                                <FormControl>
                                    <Input placeholder='Enter email/username' {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name='username'
                        render={(field) => <></>}
                    />
                    <FormField
                        control={form.control}
                        name='password'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        type='password'
                                        placeholder='Enter password...'
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button className={'w-full mt-6'} type='submit'>
                        Continue
                    </Button>
                    <div className={'flex justify-center flex-row'}>
                        <p className={''}>Don&apos;t have an account?</p>
                        <Link href={'/'}>
                            <p className={'ml-2 text-primary hover:underline'}>Sign Up</p>
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
                            <FontAwesomeIcon
                                icon={faGoogle}
                                className={'pr-5'}
                                size={'3x'}
                                color={'#ACACAC'}
                            />
                        </button>
                        <button onClick={() => {
                        }}>
                            <FontAwesomeIcon
                                icon={faGithub}
                                className={'pl-5'}
                                size={'3x'}
                                color={'#ACACAC'}
                            />
                        </button>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default LogInForm;
