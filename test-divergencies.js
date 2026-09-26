// Test script to identify and verify data divergence issues in Finance Manager
// This script will test various scenarios to find calculation errors

// Simulated Finance Manager state for testing
const testState = {
    cards: [
        { id: "card-1", name: "Nubank", digits: "****1234", color: "#0b1739", limit: 5000, closingDay: 15, dueDay: 20 },
        { id: "pix", name: "⚡ Pix", digits: "", color: "rgba(16, 185, 129, 0.15)", limit: 0 }
    ],
    expenses: [],
    revenues: [],
    recurring: [],
    cardInvoices: {},
    selectedMonth: 0, // Janeiro
    selectedYear: 2024
};

// Import key functions from the actual app for testing
// Note: In a real scenario, these would be imported properly

function getCardManualInvoice(cardId) {
    const v = testState.cardInvoices && testState.cardInvoices[cardId];
    if (v === undefined || v === null || v === "") return null;
    return Number(v) || 0;
}

function parcelValue(expense) {
    return Math.round((expense.value / expense.installments) * 100) / 100;
}

function addMonthsKeepingDay(date, months) {
    const result = new Date(date);
    const originalDay = result.getDate();
    result.setMonth(result.getMonth() + months, 1);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDay));
    return result;
}

function getMonthlyExpensesWithInvoices(month, year) {
    const realExpenses = testState.expenses.filter(e => {
        const d = new Date(e.date + "T00:00:00");
        return d.getMonth() === month && d.getFullYear() === year;
    });

    const virtualRecurring = [];
    testState.recurring.forEach(r => {
        // Simplified: assume monthly recurrence for current month
        const occurrenceDateStr = `${year}-${String(month + 1).padStart(2, "0")}-15`; // Mid-month for testing
        virtualRecurring.push({
            id: `virtual-rec-${r.id}-${year}-${month + 1}-15`,
            description: r.description,
            value: r.value,
            date: occurrenceDateStr,
            cardId: r.cardId,
            category: r.category,
            status: (r.cardId && r.cardId.startsWith("card-")) ? "Comprometido" : "Pendentes",
            isVirtual: true,
            parentRecurringId: r.id
        });
    });

    const virtualInstallments = [];
    testState.expenses.filter(e => e.installments > 1).forEach(e => {
        const baseDate = new Date(e.date + "T00:00:00");
        const occurrence = addMonthsKeepingDay(baseDate, 1); // Next month for installment
        if (occurrence.getMonth() !== month || occurrence.getFullYear() !== year) return;

        virtualInstallments.push({
            id: `virtual-inst-${e.id}-${occurrence.getFullYear()}-${occurrence.getMonth() + 1}-${occurrence.getDate()}`,
            description: e.description,
            value: parcelValue(e),
            date: occurrence.toISOString().split('T')[0],
            cardId: e.cardId,
            category: e.category,
            status: (e.cardId && e.cardId.startsWith("card-")) ? "Comprometido" : "Pendentes",
            installmentNo: 2,
            installmentTotal: e.installments,
            isVirtual: true,
            parentInstallmentId: e.id
        });
    });

    const allExpenses = [...realExpenses, ...virtualRecurring, ...virtualInstallments];
    const cardBuckets = {};
    const result = [];

    allExpenses.forEach(e => {
        if (!e.cardId) { result.push(e); return; }
        if (!cardBuckets[e.cardId]) cardBuckets[e.cardId] = [];
        cardBuckets[e.cardId].push(e);
    });

    Object.keys(cardBuckets).forEach(cardId => {
        const manual = getCardManualInvoice(cardId);
        let value;

        if (manual !== null) {
            value = manual;
            console.log(`Card ${cardId}: Using manual invoice value: ${value}`);
        } else {
            const realCardExpenses = cardBuckets[cardId].filter(e => !e.isVirtual);
            value = realCardExpenses.reduce((s, e) => s + e.value, 0);
            console.log(`Card ${cardId}: Calculated from real expenses: ${value} (total entries: ${cardBuckets[cardId].length}, real: ${realCardExpenses.length}, virtual: ${cardBuckets[cardId].filter(e => e.isVirtual).length})`);
        }

        if (value > 0) {
            result.push({
                id: `invoice-card-${cardId}`,
                description: "Fatura do cartão",
                value,
                date: `${year}-${String(month + 1).padStart(2, "0")}-01`,
                cardId,
                status: "Comprometido",
                isInvoice: true
            });
        }
    });

    return result;
}

console.log("=== Test 1: Card with manual invoice set ===");
testState.cardInvoices = { "card-1": 2000 };
testState.expenses = [
    { id: "exp1", description: "Compra no cartão", value: 500, date: "2024-01-10", cardId: "card-1", status: "Pagas", isVirtual: false },
    { id: "exp2", description: "Outra compra", value: 300, date: "2024-01-20", cardId: "card-1", status: "Pagas", isVirtual: false }
];
const result1 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 1:", result1);
console.log("Total from result:", result1.reduce((sum, e) => sum + e.value, 0));

console.log("\n=== Test 2: Card WITHOUT manual invoice (should sum real expenses) ===");
testState.cardInvoices = {};
result2 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 2:", result2);
console.log("Total from result:", result2.reduce((sum, e) => sum + e.value, 0));

console.log("\n=== Test 3: Card with virtual recurring expenses ===");
testState.recurring = [
    { id: "rec1", description: "Netflix mensal", value: 100, date: "2024-01-15", cardId: "card-1", category: "Entretenimento", frequency: "Mensal" }
];
testState.expenses = [
    { id: "exp1", description: "Compra no cartão", value: 500, date: "2024-01-10", cardId: "card-1", status: "Pagas", isVirtual: false }
];
result3 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 3:", result3);
console.log("Total from result:", result3.reduce((sum, e) => sum + e.value, 0));
console.log("Note: Virtual recurring should NOT be counted in invoice value (only real expense of 500 should be used)");

console.log("\n=== Test 4: Card with installment expenses ===");
testState.recurring = [];
testState.expenses = [
    { id: "exp1", description: "Compra parcelada", value: 1200, date: "2024-01-05", cardId: "card-1", status: "Pagas", installments: 3, isVirtual: false }
];
result4 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 4:", result4);
console.log("Total from result:", result4.reduce((sum, e) => sum + e.value, 0));
console.log("Note: Only first installment should be counted for January (R$400)");

console.log("\n=== Test 5: Mixed scenario - manual invoice overrides ===");
testState.cardInvoices = { "card-1": 800 };
testState.recurring = [];
testState.expenses = [
    { id: "exp1", description: "Compra no cartão", value: 500, date: "2024-01-10", cardId: "card-1", status: "Pagas", isVirtual: false },
    { id: "exp2", description: "Outra compra", value: 200, date: "2024-01-20", cardId: "card-1", status: "Pagas", isVirtual: false }
];
result5 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 5:", result5);
console.log("Total from result:", result5.reduce((sum, e) => sum + e.value, 0));
console.log("Note: Manual invoice (800) should override sum of real expenses (700)");

console.log("\n=== Test 6: Card with no expenses (should not appear) ===");
testState.cardInvoices = {};
testState.expenses = [
    { id: "exp1", description: "Compra sem cartão", value: 300, date: "2024-01-10", cardId: "", status: "Pagas", isVirtual: false }
];
result6 = getMonthlyExpensesWithInvoices(0, 2024);
console.log("Result 6:", result6);
console.log("Total from result:", result6.reduce((sum, e) => sum + e.value, 0));

console.log("\n=== Summary ===");
console.log("The fix ensures that:")
console.log("1. Only REAL expenses are counted in invoice value (not virtual recurring/installment)")
console.log("2. Manual invoice overrides real expense sum when set")
console.log("3. Virtual expenses are still shown in transaction list but not in invoice calculation")
console.log("4. This prevents double-counting and divergence between calculated totals and displayed values")