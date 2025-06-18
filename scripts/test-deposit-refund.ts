// Script para probar el reembolso de €0.10 manualmente
import stripe from "@/lib/stripe-config"

async function testDepositRefund() {
  try {
    console.log("🔍 Testing deposit refund for €0.10...")

    // Verificar que stripe no sea null
    if (!stripe) {
      throw new Error("Stripe instance is null.");
    }

    // Buscar un payment intent reciente con €0.10
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10,
    })

    console.log("Recent payment intents:")
    paymentIntents.data.forEach((pi) => {
      console.log(`- ${pi.id}: €${pi.amount / 100} (${pi.status})`)
    })

    // Buscar uno de €0.10 (10 centavos)
    const tenCentPayment = paymentIntents.data.find((pi) => pi.amount === 10)

    if (tenCentPayment) {
      console.log(`\n🎯 Found €0.10 payment: ${tenCentPayment.id}`)

      // Intentar reembolso
      const refund = await stripe.refunds.create({
        payment_intent: tenCentPayment.id,
        amount: 10, // €0.10 en centavos
        reason: "requested_by_customer",
        metadata: {
          test: "manual_deposit_refund_test",
          timestamp: new Date().toISOString(),
        },
      })

      console.log("✅ Refund created successfully:")
      console.log(`- Refund ID: ${refund.id}`)
      console.log(`- Amount: €${refund.amount / 100}`)
      console.log(`- Status: ${refund.status}`)
    } else {
      console.log("❌ No €0.10 payment found to refund")
    }
  } catch (error) {
    console.error("❌ Error testing refund:", error)
  }
}

// Ejecutar test
testDepositRefund()
