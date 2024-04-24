export interface BankType {
  id: number;
  code: string;
  name: string;
}

export interface BankInterface {
  bank_name: string
  bank_code: string
}

export const products = [
  { name: "Nunotek(STX-1)", deposit: 3000, dailyIncome: 750, runtime: 20, totalIncome: 15000, image: "nunotek.png"},
  { name: "Nunotek(STX-2)", deposit: 5000, dailyIncome: 1250, runtime: 20, totalIncome: 25000, image: "nunotek.png"},
  { name: "Nunotek(STX-3)", deposit: 10000, dailyIncome: 2500, runtime: 20, totalIncome: 50000, image: "nunotek.png"},
  { name: "Nunotek(STX-4)", deposit: 20000, dailyIncome: 5000, runtime: 20, totalIncome: 100000, image: "nunotek.png"},
  { name: "Nunotek(STX-5)", deposit: 50000, dailyIncome: 12500, runtime: 20, totalIncome: 250000, image: "nunotek.png"},
  { name: "Nunotek(STX-7)", deposit: 100000, dailyIncome: 25000, runtime: 20, totalIncome: 500000, image: "nunotek.png"},
  { name: "Nunotek(STX-8)", deposit: 150000, dailyIncome: 37500, runtime: 20, totalIncome: 750000, image: "nunotek.png"},
  { name: "Nunotek(STX-9)", deposit: 200000, dailyIncome: 50000, runtime: 20, totalIncome: 1000000, image: "nunotek.png"},
  { name: "Nunotek(STX-10)", deposit: 300000, dailyIncome: 75000, runtime: 20, totalIncome: 1500000, image: "nunotek.png"},
  { name: "Nunotek(STX-11)", deposit: 500000, dailyIncome: 125000, runtime: 20, totalIncome: 2500000, image: "nunotek.png"},
  { name: "Nunotek(STX-12)", deposit: 750000, dailyIncome: 187500, runtime: 20, totalIncome: 3750000, image: "nunotek.png"}
]

export interface ProductType {
  name: string,
  deposit: number
  dailyIncome: number
  runtime: number
  totalIncome: number
  image: string
}

interface CustomerType {
  email: string
  customer_code: string
  domain: string
  id: number
  created_at: string
  updated_at: string
}

const initiateBankAccount = async (email: string, amount: string, reference: string, name: string) => {
  const res = await fetch('https://api.budpay.com/api/s2s/banktransfer/initialize', {
    method: "post",
    body: JSON.stringify({ email, amount, currency: "NGN", reference, name }),
    headers: {
      'Authorization': `Bearer ${process.env.BUDPAY_SECRET_KEY!}`,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
  return data
}

const createVirtualAccount = async (customer: string) => {
  const res = await fetch(`https://api.budpay.com/api/v2/dedicated_virtual_account`, {
    method: "post",
    body: JSON.stringify({ customer }),
    headers: {
      Authorization: "Bearer " + process.env.BUDPAY_SECRET_KEY!,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
  return data
}

const getDedicatedAccount = async (id: number) => {
  const res = await fetch("https://api.budpay.com/api/v2/dedicated_account/" + id, {
    method: "get",
    headers: {
      'Authorization': `Bearer ${process.env.BUDPAY_SECRET_KEY!}`
    }
  })
  const data = await res.json()
  return data
}

const createCustomer = async (email: string, first_name: string, last_name: string, phone: string): Promise<CustomerType> => {
  const res = await fetch("https://api.budpay.com/api/v2/customer", {
    method: "post",
    body: JSON.stringify({ email, first_name, last_name, phone }),
    headers: {
      Authorization: "Bearer " + process.env.BUDPAY_SECRET_KEY!,
      'Content-Type': 'application/json'
    }
  })
  const data = await res.json()
  return data.data
}