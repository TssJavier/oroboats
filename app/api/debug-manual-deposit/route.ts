import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    console.log("🔍 === INICIANDO DEBUG COMPLETO DE MANUAL DEPOSIT ===")

    const debugResults: {
      step1_table_structure: unknown | null,
      step2_current_values: unknown | null,
      step3_update_test_value: unknown | null,
      step4_verify_after_update: unknown | null,
      step5_api_simulation: unknown | null,
      step6_data_types: unknown | null,
      step7_final_comparison: unknown | null,
    } = {
      step1_table_structure: null,
      step2_current_values: null,
      step3_update_test_value: null,
      step4_verify_after_update: null,
      step5_api_simulation: null,
      step6_data_types: null,
      step7_final_comparison: null,
    }

    // PASO 1: Verificar estructura de la tabla
    console.log("📊 PASO 1: Verificando estructura de la tabla...")
    try {
      const tableStructure = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles' 
        AND column_name LIKE '%deposit%'
        ORDER BY column_name
      `)
      debugResults.step1_table_structure = tableStructure
      console.log("✅ Estructura de tabla obtenida:", tableStructure)
    } catch (error) {
      console.error("❌ Error en paso 1:", error)
      debugResults.step1_table_structure = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 2: Verificar valores actuales
    console.log("📊 PASO 2: Verificando valores actuales...")
    try {
      const currentValues = await db.execute(sql`
        SELECT id, name, security_deposit, manualDeposit 
        FROM vehicles 
        WHERE name ILIKE '%GTX%' OR name ILIKE '%test%' OR id <= 5
        ORDER BY id
        LIMIT 10
      `)
      debugResults.step2_current_values = currentValues
      console.log("✅ Valores actuales:", currentValues)
    } catch (error) {
      console.error("❌ Error en paso 2:", error)
      debugResults.step2_current_values = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 3: Actualizar valor de prueba
    console.log("📊 PASO 3: Actualizando valor de prueba...")
    try {
      const updateResult = await db.execute(sql`
        UPDATE vehicles 
        SET manualdeposit = 299.99 
        WHERE (name ILIKE '%GTX%' OR id = 1)
        AND (manualdeposit IS NULL OR manualdeposit = 0 OR manualdeposit::numeric = 0)
        RETURNING id, name, manualdeposit
      `)
      debugResults.step3_update_test_value = updateResult
      console.log("✅ Actualización realizada:", updateResult)
    } catch (error) {
      console.error("❌ Error en paso 3:", error)
      debugResults.step3_update_test_value = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 4: Verificar después de la actualización
    console.log("📊 PASO 4: Verificando después de actualización...")
    try {
      const afterUpdate = await db.execute(sql`
        SELECT id, name, security_deposit, manualdeposit 
        FROM vehicles 
        WHERE name ILIKE '%GTX%' OR id <= 5
        ORDER BY id
        LIMIT 5
      `)
      debugResults.step4_verify_after_update = afterUpdate
      console.log("✅ Valores después de actualización:", afterUpdate)
    } catch (error) {
      console.error("❌ Error en paso 4:", error)
      debugResults.step4_verify_after_update = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 5: Simular consulta del API real
    console.log("📊 PASO 5: Simulando consulta del API real...")
    try {
      const apiSimulation = await db.execute(sql`
        SELECT 
          id, 
          name, 
          type, 
          security_deposit as "securityDeposit",
          manualdeposit as "manualDeposit",
          stock
        FROM vehicles 
        WHERE name ILIKE '%GTX%' OR id <= 3
        ORDER BY id
        LIMIT 3
      `)
      debugResults.step5_api_simulation = apiSimulation
      console.log("✅ Simulación de API:", apiSimulation)
    } catch (error) {
      console.error("❌ Error en paso 5:", error)
      debugResults.step5_api_simulation = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 6: Verificar tipos de datos
    console.log("📊 PASO 6: Verificando tipos de datos...")
    try {
      const dataTypes = await db.execute(sql`
        SELECT 
          id,
          name,
          pg_typeof(security_deposit) as security_deposit_type,
          pg_typeof(manualdeposit) as manualdeposit_type,
          security_deposit,
          manualdeposit,
          security_deposit::text as security_deposit_as_text,
          manualdeposit::text as manualdeposit_as_text
        FROM vehicles 
        WHERE name ILIKE '%GTX%' OR id <= 2
        ORDER BY id
        LIMIT 2
      `)
      debugResults.step6_data_types = dataTypes
      console.log("✅ Tipos de datos:", dataTypes)
    } catch (error) {
      console.error("❌ Error en paso 6:", error)
      debugResults.step6_data_types = { error: error instanceof Error ? error.message : String(error) }
    }

    // PASO 7: Comparación final con procesamiento JavaScript
    console.log("📊 PASO 7: Comparación final con procesamiento...")
    try {
      if (debugResults.step5_api_simulation && Array.isArray(debugResults.step5_api_simulation)) {
        const processedData = debugResults.step5_api_simulation.map((vehicle) => {
          const original = {
            id: vehicle.id,
            name: vehicle.name,
            securityDeposit: vehicle.securityDeposit,
            manualDeposit: vehicle.manualDeposit,
          }

          const processed = {
            id: vehicle.id,
            name: vehicle.name,
            securityDeposit: Number(vehicle.securityDeposit) || 0,
            manualDeposit: Number(vehicle.manualDeposit) || 0,
          }

          return {
            original,
            processed,
            types: {
              originalManualDeposit: typeof vehicle.manualDeposit,
              processedManualDeposit: typeof processed.manualDeposit,
            },
            values: {
              originalValue: vehicle.manualDeposit,
              processedValue: processed.manualDeposit,
              stringValue: String(vehicle.manualDeposit),
              numberValue: Number(vehicle.manualDeposit),
            },
          }
        })

        debugResults.step7_final_comparison = processedData
        console.log("✅ Comparación final:", processedData)
      }
    } catch (error) {
      console.error("❌ Error en paso 7:", error)
      debugResults.step7_final_comparison = { error: error instanceof Error ? error.message : String(error) }
    }

    // RESUMEN FINAL
    console.log("🎯 === RESUMEN DEL DEBUG ===")
    console.log("1. Estructura de tabla:", Array.isArray(debugResults.step1_table_structure) ? debugResults.step1_table_structure.length : "Error")
    console.log("2. Valores actuales:", Array.isArray(debugResults.step2_current_values) ? debugResults.step2_current_values.length : "Error")
    console.log("3. Actualización:", Array.isArray(debugResults.step3_update_test_value) ? debugResults.step3_update_test_value.length : "Error")
    console.log("4. Verificación:", Array.isArray(debugResults.step4_verify_after_update) ? debugResults.step4_verify_after_update.length : "Error")
    console.log("5. API simulación:", Array.isArray(debugResults.step5_api_simulation) ? debugResults.step5_api_simulation.length : "Error")
    console.log("6. Tipos de datos:", Array.isArray(debugResults.step6_data_types) ? debugResults.step6_data_types.length : "Error")
    console.log("7. Comparación final:", Array.isArray(debugResults.step7_final_comparison) ? debugResults.step7_final_comparison.length : "Error")

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      debugResults,
      summary: {
        tableStructureFound: !!debugResults.step1_table_structure,
        vehiclesFound: Array.isArray(debugResults.step2_current_values) ? debugResults.step2_current_values.length : 0,
        updatesApplied: Array.isArray(debugResults.step3_update_test_value) ? debugResults.step3_update_test_value.length : 0,
        apiSimulationWorked: !!debugResults.step5_api_simulation,
        dataTypesChecked: !!debugResults.step6_data_types,
        finalComparisonDone: !!debugResults.step7_final_comparison,
      },
    })
  } catch (error) {
    console.error("❌ ERROR GENERAL EN DEBUG:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
