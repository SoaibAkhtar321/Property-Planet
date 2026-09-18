"use client"
import React, { useRef } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import { createGeneralInquiry } from '@/lib/leads/actions';

interface FormData {
   user_name: string;
   user_email: string;
   user_phone: string;
   message: string;
   // Honeypot: a real visitor never sees or fills this field (hidden via
   // CSS below), but a simple bot filling every input on the page will.
   // Not part of the validation schema — checked separately in sendEmail
   // so a filled honeypot fails silently rather than showing a validation
   // error that would tip a bot off. This is defense-in-depth alongside
   // the DB-level rate limit (0025_general_inquiry_rate_limit.sql), which
   // is the actual boundary since it can't be bypassed by skipping JS.
   company_website?: string;
}

const schema = yup
   .object({
      user_name: yup.string().required().label("Name"),
      user_email: yup.string().required().email().label("Email"),
      user_phone: yup.string().required().min(7).label("Phone number"),
      message: yup.string().required().label("Message"),
   })
   .required();

const ContactForm = () => {

   const { register, handleSubmit, reset, formState: { errors }, } = useForm<FormData>({ resolver: yupResolver(schema), });

   const form = useRef<HTMLFormElement>(null);

   const sendEmail = async (data: FormData) => {
      // Honeypot tripped: a real visitor never fills a field that's
      // hidden with CSS. Pretend success (no error shown, form resets)
      // so a bot gets no signal that it was caught, but never actually
      // call the server action or EmailJS.
      if (data.company_website) {
         reset();
         return;
      }

      // Persist to the leads table first, so the enquiry reaches
      // Admin -> Leads even if the EmailJS notification below fails for
      // any reason (blocked script, rate limit, etc).
      try {
         const result = await createGeneralInquiry({
            name: data.user_name,
            email: data.user_email,
            phone: data.user_phone,
            message: data.message,
         });
         if (!result.success) {
            toast(result.error ?? 'Failed to send message. Please try again.', { position: 'top-center' });
            return;
         }
      } catch (err) {
         console.error(err);
         toast('Failed to send message. Please try again.', { position: 'top-center' });
         return;
      }

      if (form.current) {
         emailjs.sendForm('service_070078r', 'template_lojvsvb', form.current, 'mtLgOuG25NnIwGeKm')
            .then((result) => {
               const notify = () => toast('Message sent successfully', { position: 'top-center' });
               notify();
               reset();
               console.log(result.text);
            }, (error) => {
               // The lead is already saved at this point — an email-relay
               // hiccup should not look like the enquiry was lost.
               const notify = () => toast('Message sent successfully', { position: 'top-center' });
               notify();
               reset();
               console.log(error.text);
            });
      } else {
         console.error("Form reference is null");
      }
   };

   return (
      <form ref={form} onSubmit={handleSubmit(sendEmail)}>
         <h3>Send Message</h3>
         <div className="messages"></div>
         <div className="row controls">
            {/* Honeypot field — hidden from real visitors, left visible to
                simple bots that fill every field programmatically. */}
            <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
               <label htmlFor="company_website">Leave this field empty</label>
               <input
                  type="text"
                  id="company_website"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("company_website")}
               />
            </div>
            <div className="col-12">
               <div className="input-group-meta form-group mb-30">
                  <label htmlFor="">Name*</label>
                  <input type="text" {...register("user_name")} name="user_name" placeholder="Your Name*" />
                  <p className="form_error">{errors.user_name?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <div className="input-group-meta form-group mb-30">
                  <label htmlFor="">Email*</label>
                  <input type="email" {...register("user_email")} placeholder="Email Address*" name="user_email" />
                  <p className="form_error">{errors.user_email?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <div className="input-group-meta form-group mb-40">
                  <label htmlFor="">Phone*</label>
                  <input type="tel" {...register("user_phone")} placeholder="Phone Number*" name="user_phone" />
                  <p className="form_error">{errors.user_phone?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <div className="input-group-meta form-group mb-35">
                  <textarea {...register("message")} placeholder="Your message*"></textarea>
                  <p className="form_error">{errors.message?.message}</p>
               </div>
            </div>
            <div className="col-12">
               <button type='submit' className="btn-nine text-uppercase rounded-3 fw-normal w-100">Send Message</button>
            </div>
         </div>
      </form>
   )
}

export default ContactForm
