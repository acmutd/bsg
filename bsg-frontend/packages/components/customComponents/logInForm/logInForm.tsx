'use client';
import React from 'react';
import {Button} from '@bsg/ui/button';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage,} from '@bsg/ui/form';
import {Input} from '@bsg/ui/input';
import Link from 'next/link';
import {Separator} from '@bsg/ui/separator';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGithub, faGoogle, faDiscord} from '@fortawesome/free-brands-svg-icons';
import useLogInForm from '@bsg/components/logInForm/useLogInForm';
import {IconProp} from "@fortawesome/fontawesome-svg-core";

const socialButton = 'btn-ghost inline-flex h-12 w-12 items-center justify-center rounded-full text-foreground/70 hover:text-foreground';

const LogInForm = () => {
    const {form, onSubmit} = useLogInForm();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                <div className={'space-y-4'}>
                    <div className={'mb-6 space-y-1.5'}>
                        <p className={'eyebrow'}>Welcome back</p>
                        <p className={'display text-3xl'}>Log in</p>
                    </div>
                    <FormField
                        control={form.control}
                        name='email'
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className='text-xs text-foreground/60'>Email/Username</FormLabel>
                                <FormControl>
                                    <Input className='h-11 rounded-xl' placeholder='Enter email/username' {...field} />
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
                                <FormLabel className='text-xs text-foreground/60'>Password</FormLabel>
                                <FormControl>
                                    <Input
                                        className='h-11 rounded-xl'
                                        type='password'
                                        placeholder='Enter password...'
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button className={'btn-signal w-full h-11 mt-6 rounded-full text-[0.95rem] font-semibold'} type='submit'>
                        Continue
                    </Button>
                    <div className={'flex justify-center flex-row flex-wrap text-center min-w-0 text-sm text-foreground/60'}>
                        <p className={''}>Don&apos;t have an account?</p>
                        <Link href={'/auth/signUp'}>
                            <p className={'ml-2 text-signal hover:underline underline-offset-4'}>Sign Up</p>
                        </Link>
                    </div>
                    <div className={'flex flex-row items-center justify-center'}>
                        <Separator className={'mr-3 w-5/12'}/>
                        <p className={'font-mono text-xs text-foreground/40'}>or</p>
                        <Separator className={'ml-3 w-5/12'}/>
                    </div>
                    <div className={'flex justify-center flex-row gap-3 min-w-0'}>
                        <button type='button' aria-label='Continue with Google' onClick={() => {}} className={socialButton}>
                            <FontAwesomeIcon icon={faGoogle as IconProp} className={'h-5 w-5'}/>
                        </button>
                        <button type='button' aria-label='Continue with GitHub' onClick={() => {}} className={socialButton}>
                            <FontAwesomeIcon icon={faGithub as IconProp} className={'h-5 w-5'}/>
                        </button>
                        <button type='button' aria-label='Continue with Discord' onClick={() => {}} className={socialButton}>
                            <FontAwesomeIcon icon={faDiscord as IconProp} className={'h-5 w-5'}/>
                        </button>
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default LogInForm;
