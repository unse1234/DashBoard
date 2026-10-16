import type { Customer } from "@/types/customer.types"
import { formatCurrency } from "@/utils/format-number"

type CustomerSpentProps = {
  spentByCurrency: Customer["spentByCurrency"]
}

/**
 * What a customer has spent, one amount per currency as the API reports it.
 * Rupees are the only currency, so it is a single line.
 */
export function CustomerSpent({ spentByCurrency }: CustomerSpentProps) {
  if (spentByCurrency.length === 0) {
    return <span className="text-muted-foreground">Nothing yet</span>
  }

  return (
    <ul className="flex flex-col">
      {spentByCurrency.map(({ currency, amount }) => (
        <li key={currency}>{formatCurrency(amount, currency)}</li>
      ))}
    </ul>
  )
}
