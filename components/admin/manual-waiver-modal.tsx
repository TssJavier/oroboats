"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { LiabilityWaiver } from "@/components/booking/liability-waiver"

interface ManualWaiverModalProps {
  isOpen: boolean
  onClose: () => void
  onWaiverSigned: (waiverId: number) => void
  customerName: string
  customerEmail: string
  customerDni: string
  manualDeposit: number
}

export function ManualWaiverModal({
  isOpen,
  onClose,
  onWaiverSigned,
  customerName,
  customerEmail,
  customerDni,
  manualDeposit
}: ManualWaiverModalProps) {
  const [step, setStep] = useState(1)

  const handleBack = () => {
    onClose()
  }

  const handleWaiverSigned = (waiverId: number) => {
    onWaiverSigned(waiverId)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold" />
            Documento de Exención de Responsabilidad
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <LiabilityWaiver
            customerName={customerName}
            customerEmail={customerEmail}
            customerDni={customerDni}
            manualDeposit={manualDeposit}
            onWaiverSigned={handleWaiverSigned}
            onBack={handleBack}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
