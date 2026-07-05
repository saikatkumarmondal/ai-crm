// src/app/(auth)/register/page.tsx

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User, Building2, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { registerFormSchema, type RegisterFormValues } from "@/lib/validators/authForm.validator";
import { useRegister } from "@/lib/hooks/useAuth";

export default function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  const onSubmit = (values: RegisterFormValues) => {
    const { confirmPassword: _confirmPassword, ...payload } = values;
    registerUser.mutate(payload);
  };

  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(18,24,31,0.15)] p-8">
      <motion.h1
        className="font-display text-3xl font-semibold mb-1"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        Create your workspace
      </motion.h1>
      <p className="text-sm text-neutral-500 mb-7">Start managing your pipeline in minutes</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field icon={<User className="w-4 h-4" />} label="Full name" type="text" placeholder="Saikat Kumar" error={errors.fullName?.message} registration={register("fullName")} />
        <Field icon={<Building2 className="w-4 h-4" />} label="Organization" type="text" placeholder="Acme Inc" error={errors.organizationName?.message} registration={register("organizationName")} />
        <Field icon={<Mail className="w-4 h-4" />} label="Email" type="email" placeholder="[email protected]" error={errors.email?.message} registration={register("email")} />

        <div className="grid grid-cols-2 gap-3">
          <Field icon={<Lock className="w-4 h-4" />} label="Password" type="password" placeholder="••••••••" error={errors.password?.message} registration={register("password")} />
          <Field icon={<Lock className="w-4 h-4" />} label="Confirm" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} registration={register("confirmPassword")} />
        </div>

        {registerUser.isError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-[color:var(--color-falling)] bg-red-50 border border-red-100 rounded-xl px-3 py-2"
          >
            {registerUser.error instanceof Error ? registerUser.error.message : "Registration failed"}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={registerUser.isPending}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.98 }}
          className="w-full relative overflow-hidden rounded-xl bg-[color:var(--color-ink)] text-white py-3 font-medium flex items-center justify-center gap-2 group disabled:opacity-70"
        >
          <span
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: "linear-gradient(90deg, var(--color-ledger), var(--color-signal))" }}
          />
          <span className="relative z-10 flex items-center gap-2">
            {registerUser.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Create workspace <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </span>
        </motion.button>
      </form>

      <p className="text-sm text-neutral-500 mt-7 text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-[color:var(--color-signal)] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  type,
  placeholder,
  error,
  registration,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  placeholder: string;
  error?: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">{label}</label>
      <div className="relative group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-[color:var(--color-signal)] transition-colors">
          {icon}
        </span>
        <input
          type={type}
          placeholder={placeholder}
          {...registration}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 bg-white/80 outline-none transition-all focus:border-[color:var(--color-signal)] focus:ring-4 focus:ring-[color:var(--color-signal-soft)]/30 text-sm"
        />
      </div>
      {error && <p className="text-xs text-[color:var(--color-falling)]">{error}</p>}
    </div>
  );
}