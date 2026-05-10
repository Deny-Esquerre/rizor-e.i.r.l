"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import logoUrl from "@/assets/2018/2.2.png"

import { supabase } from "@/lib/supabase"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const validateEmail = (value: string) => {
    const regex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
    return regex.test(value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setIsEmailValid(validateEmail(value))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg("")
    
    const formData = new FormData(e.currentTarget)
    const currentEmail = formData.get("email") as string
    const currentPassword = formData.get("password") as string
    
    if (!validateEmail(currentEmail)) {
      setIsEmailValid(false)
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    navigate("/dashboard")
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <img 
                src={logoUrl} 
                alt="FishFlow Logo" 
                className="w-32 h-auto object-contain"
              />
              <span className="sr-only">FishFlow</span>
            </a>
            <h1 className="text-xl font-bold">Bienvenido a FishFlow</h1>
            <FieldDescription>
              Sistema de acceso privado y restringido.
            </FieldDescription>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              value={email}
              onChange={handleEmailChange}
              aria-invalid={!isEmailValid}
              title="Por favor, ingresa un correo electrónico válido."
            />
            {!isEmailValid && email !== "" && (
              <p className="text-[0.8rem] font-medium text-destructive">
                Por favor, ingresa un correo electrónico válido.
              </p>
            )}
          </Field>
          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <a
                href="#"
                className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type={showPassword ? "text" : "password"} 
                required 
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
                <span className="sr-only">
                  {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                </span>
              </button>
            </div>
          </Field>
          <div className="flex items-center space-x-2 py-1">
            <Checkbox id="remember" name="remember" />
            <label
              htmlFor="remember"
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              Recuérdame
            </label>
          </div>
          {errorMsg && (
            <p className="text-sm font-medium text-destructive text-center">
              {errorMsg === "Invalid login credentials" 
                ? "Credenciales incorrectas" 
                : errorMsg}
            </p>
          )}
          <Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
