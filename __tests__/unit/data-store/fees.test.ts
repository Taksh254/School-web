import { getFees, addFee, markFeePaid, deleteFee, getPayments } from "@/lib/data-store"
import { mockFeeRecord, mockFeePending, mockFeeOverdue, seedLocalStorage } from "../../fixtures/test-data"
import type { FeeRecord } from "@/lib/types"

describe("Fees CRUD — localStorage mode", () => {
  describe("getFees", () => {
    it("returns empty array when no fees exist", async () => {
      const fees = await getFees()
      expect(fees).toEqual([])
    })

    it("returns all fees when no studentId filter is given", async () => {
      seedLocalStorage()
      const fees = await getFees()
      expect(fees.length).toBe(4) // mockFeeRecord, mockFeePending, mockFeeOverdue, mockFeePartial
    })

    it("filters by studentId when provided", async () => {
      seedLocalStorage()
      const fees = await getFees("s1")
      expect(fees.every((f) => f.studentId === "s1")).toBe(true)
      expect(fees.length).toBe(2) // mockFeeRecord + mockFeePending
    })

    it("returns empty when studentId has no matching fees", async () => {
      seedLocalStorage()
      const fees = await getFees("nonexistent-student")
      expect(fees).toEqual([])
    })
  })

  describe("addFee", () => {
    it("adds a fee record and returns it with a generated id", async () => {
      const newFee: Omit<FeeRecord, "id" | "createdAt"> = {
        studentId: "s1",
        studentName: "Aanya Sharma",
        term: "Q3 Oct-Dec 2026",
        amount: 25000,
        paidAmount: 0,
        dueDate: "2026-10-15",
        status: "pending",
      }
      const added = await addFee(newFee)
      expect(added.id).toBeDefined()
      expect(added.studentId).toBe("s1")
      expect(added.term).toBe("Q3 Oct-Dec 2026")
    })

    it("sets createdAt to today's date (YYYY-MM-DD format)", async () => {
      const newFee: Omit<FeeRecord, "id" | "createdAt"> = {
        studentId: "s1",
        studentName: "Aanya Sharma",
        term: "Q3 Oct-Dec 2026",
        amount: 25000,
        paidAmount: 0,
        dueDate: "2026-10-15",
        status: "pending",
      }
      const added = await addFee(newFee)
      expect(added.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(added.createdAt).toBe(new Date().toISOString().slice(0, 10))
    })

    it("persists the fee so getFees returns it", async () => {
      const newFee: Omit<FeeRecord, "id" | "createdAt"> = {
        studentId: "s1",
        studentName: "Aanya Sharma",
        term: "Q3 Oct-Dec 2026",
        amount: 25000,
        paidAmount: 0,
        dueDate: "2026-10-15",
        status: "pending",
      }
      await addFee(newFee)
      const fees = await getFees("s1")
      expect(fees.some((f) => f.term === "Q3 Oct-Dec 2026")).toBe(true)
    })
  })

  describe("markFeePaid", () => {
    beforeEach(() => seedLocalStorage())

    it("sets paidAmount = amount and status = paid for an overdue fee", async () => {
      await markFeePaid("f3") // mockFeeOverdue: amount=22000, paidAmount=0
      const fees = await getFees("s2")
      const updated = fees.find((f) => f.id === "f3")
      expect(updated?.status).toBe("paid")
      expect(updated?.paidAmount).toBe(22000)
    })

    it("creates a payment record when fee is marked paid", async () => {
      await markFeePaid("f3")
      const payments = await getPayments("s2")
      expect(payments.some((p) => p.feeId === "f3")).toBe(true)
    })

    it("payment record has the correct amount (remaining balance)", async () => {
      await markFeePaid("f4", "Cash") // mockFeePartial: amount=22000, paidAmount=11000 → remaining=11000
      const payments = await getPayments("s2")
      const payment = payments.find((p) => p.feeId === "f4")
      expect(payment?.amount).toBe(11000)
      expect(payment?.method).toBe("Cash")
    })

    it("generates a receipt number in expected collision-resistant format", async () => {
      await markFeePaid("f3")
      const payments = await getPayments("s2")
      const payment = payments.find((p) => p.feeId === "f3")
      expect(payment?.receiptNo).toMatch(/^HK-[A-Z0-9]+-[A-Z0-9]{4}$/)
    })

    it("does nothing if feeId does not exist", async () => {
      const feesBefore = await getFees()
      await markFeePaid("nonexistent-fee-id")
      const feesAfter = await getFees()
      expect(feesAfter).toEqual(feesBefore)
    })
  })

  describe("deleteFee", () => {
    beforeEach(() => seedLocalStorage())

    it("removes the fee with the given id", async () => {
      await deleteFee("f2")
      const fees = await getFees()
      expect(fees.find((f) => f.id === "f2")).toBeUndefined()
    })

    it("does not remove other fee records", async () => {
      await deleteFee("f2")
      const fees = await getFees()
      expect(fees.find((f) => f.id === "f1")).toBeDefined()
    })

    it("does nothing when id does not exist", async () => {
      const countBefore = (await getFees()).length
      await deleteFee("nonexistent-id")
      const countAfter = (await getFees()).length
      expect(countAfter).toBe(countBefore)
    })
  })
})
