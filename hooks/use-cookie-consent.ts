"use client"

import { useState, useEffect } from "react"
import { cookieUtils } from "@/lib/cookies"

type ConsentStatus = "accepted" | "rejected" | "essential-only" | null

export function useCookieConsent() {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const consent = cookieUtils.get("cookie-consent") as ConsentStatus
    setConsentStatus(consent)
    setIsLoading(false)
  }, [])

  const updateConsent = (status: ConsentStatus) => {
    if (status) {
      cookieUtils.set("cookie-consent", status, 365)
    } else {
      cookieUtils.delete("cookie-consent")
    }
    setConsentStatus(status)
  }

  const hasAnalyticsConsent = consentStatus === "accepted"
  const hasEssentialConsent = consentStatus !== null

  return {
    consentStatus,
    updateConsent,
    hasAnalyticsConsent,
    hasEssentialConsent,
    isLoading,
  }
}
