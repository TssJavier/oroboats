"use client"

import { useState } from "react"
import Image from "next/image"

interface OroLoadingProps {
  fullScreen?: boolean
  className?: string
}

export function OroLoading({ fullScreen = true, className = "" }: OroLoadingProps) {
  // Aseguramos que el componente ocupe toda la pantalla y tenga la máxima prioridad de z-index
  const containerClasses = fullScreen
    ? "fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-[99999] flex items-center justify-center"
    : "flex items-center justify-center p-8"

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* Contenedor centrado con tamaño fijo */}
      <div className="flex items-center justify-center w-full max-w-[300px]">
        {/* Contenedor del logo con tamaño fijo */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Barra de progreso circular */}
          <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
            {/* Círculo base (gris claro) */}
            <circle cx="50" cy="50" r="48" fill="none" stroke="#f3f4f6" strokeWidth="2" className="opacity-40" />

            {/* Círculo de progreso principal (dorado) */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#d4af37"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="301.6"
              strokeDashoffset="75.4"
              transform="rotate(-90 50 50)"
              className="animate-circle-progress drop-shadow-lg"
            />

            {/* Círculo secundario para más efecto */}
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="#f4d03f"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="301.6"
              strokeDashoffset="150.8"
              transform="rotate(-90 50 50)"
              className="animate-circle-progress-reverse opacity-50"
            />
          </svg>

          {/* Partículas doradas flotantes */}
          <div className="absolute inset-0">
            <div className="absolute -top-3 left-1/2 w-2 h-2 bg-gold rounded-full animate-float-particle-1 opacity-70"></div>
            <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-float-particle-2 opacity-60"></div>
            <div className="absolute -bottom-3 left-1/4 w-1 h-1 bg-gold rounded-full animate-float-particle-3 opacity-80"></div>
            <div className="absolute top-1/4 -left-3 w-1 h-1 bg-yellow-300 rounded-full animate-float-particle-4 opacity-50"></div>
          </div>

          {/* Logo real de la empresa - Tamaño y centrado optimizado */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-32 animate-float-logo">
              <Image
                src="/assets/negro.png"
                alt="OroBoats Logo"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />

              {/* Efecto de brillo sutil alrededor del logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-logo {
          0%, 100% { transform: translateY(0px) scale(1) rotate(0deg); }
          25% { transform: translateY(-5px) scale(1.02) rotate(0.5deg); }
          50% { transform: translateY(-8px) scale(1.05) rotate(0deg); }
          75% { transform: translateY(-5px) scale(1.02) rotate(-0.5deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        
        @keyframes circle-progress {
          0% { stroke-dashoffset: 301.6; }
          100% { stroke-dashoffset: 0; }
        }
        
        @keyframes circle-progress-reverse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 301.6; }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float-particle-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(15px, -25px) scale(1.3); opacity: 0.3; }
        }
        
        @keyframes float-particle-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          50% { transform: translate(-20px, 20px) scale(0.8); opacity: 0.9; }
        }
        
        @keyframes float-particle-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(25px, -15px) scale(1.5); opacity: 0.2; }
        }
        
        @keyframes float-particle-4 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          50% { transform: translate(-12px, -30px) scale(0.6); opacity: 1; }
        }
        
        .animate-float-logo {
          animation: float-logo 4s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        
        .animate-circle-progress {
          animation: circle-progress 3s linear infinite;
        }
        
        .animate-circle-progress-reverse {
          animation: circle-progress-reverse 4s linear infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        .animate-float-particle-1 {
          animation: float-particle-1 4s ease-in-out infinite;
        }
        
        .animate-float-particle-2 {
          animation: float-particle-2 5s ease-in-out infinite;
        }
        
        .animate-float-particle-3 {
          animation: float-particle-3 3.5s ease-in-out infinite;
        }
        
        .animate-float-particle-4 {
          animation: float-particle-4 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Hook para manejar loading de navegación
export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false)

  const startLoading = () => {
    setIsLoading(true)
  }

  const stopLoading = () => {
    setIsLoading(false)
  }

  return { isLoading, startLoading, stopLoading }
}
