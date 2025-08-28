// ENDPOINT DESCONTINUADO - Não usa mais BIN para buscar métodos de pagamento
// Retorna métodos de pagamento padrão do Brasil
export const onRequestGet = async ({ request, env }: { request: Request; env: any }) => {
  try {
    // Métodos de pagamento comuns no Brasil - sem depender de BIN
    const paymentMethods = [
      {
        id: "master",
        name: "Mastercard",
        payment_type_id: "credit_card",
        status: "active",
        secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
        thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/master.gif",
        deferred_capture: "supported",
        settings: [],
        additional_info_needed: ["cardholder_name", "cardholder_identification_number"],
        min_allowed_amount: 0.01,
        max_allowed_amount: 25000000,
        accreditation_time: 2880,
        financial_institutions: [],
        processing_modes: ["aggregator"]
      },
      {
        id: "visa",
        name: "Visa",
        payment_type_id: "credit_card",
        status: "active",
        secure_thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
        thumbnail: "https://www.mercadopago.com/org-img/MP3/API/logos/visa.gif",
        deferred_capture: "supported",
        settings: [],
        additional_info_needed: ["cardholder_name", "cardholder_identification_number"],
        min_allowed_amount: 0.01,
        max_allowed_amount: 25000000,
        accreditation_time: 2880,
        financial_institutions: [],
        processing_modes: ["aggregator"]
      }
    ];

    return new Response(JSON.stringify(paymentMethods), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor', details: error?.message || String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};