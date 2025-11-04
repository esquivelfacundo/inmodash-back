import prisma from '../config/database'
import { CreatePaymentDto, UpdatePaymentDto } from '../types'

/**
 * Calculate commission and owner amounts based on owner's commission percentage
 */
async function calculateAmounts(contractId: number, amount: number) {
  // Get contract with apartment and owner info
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: {
      apartment: {
        include: {
          owner: true
        }
      }
    }
  })

  if (!contract) {
    throw new Error('Contract not found')
  }

  // Calculate commission if owner exists
  let commissionAmount = 0
  let ownerAmount = amount

  if (contract.apartment.owner) {
    const commissionPercentage = contract.apartment.owner.commissionPercentage || 0
    commissionAmount = (amount * commissionPercentage) / 100
    ownerAmount = amount - commissionAmount
  }

  return { commissionAmount, ownerAmount }
}

export const getAll = async (userId: number) => {
  return await prisma.payment.findMany({
    where: { userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'desc'
    }
  })
}

export const getById = async (id: number, userId: number) => {
  return await prisma.payment.findFirst({
    where: { id, userId },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const getByContractId = async (contractId: number, userId: number) => {
  return await prisma.payment.findMany({
    where: { contractId, userId },
    orderBy: {
      month: 'desc'
    }
  })
}

export const getPendingPayments = async (userId: number) => {
  return await prisma.payment.findMany({
    where: {
      userId,
      status: 'pending'
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'asc'
    }
  })
}

export const getOverduePayments = async (userId: number) => {
  const today = new Date()
  
  return await prisma.payment.findMany({
    where: {
      userId,
      status: 'pending',
      month: {
        lt: today
      }
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    },
    orderBy: {
      month: 'asc'
    }
  })
}

export const create = async (data: CreatePaymentDto, userId: number) => {
  // Calculate commission and owner amounts
  const { commissionAmount, ownerAmount } = await calculateAmounts(
    data.contractId,
    data.amount
  )

  return await prisma.payment.create({
    data: {
      userId,
      contractId: data.contractId,
      month: new Date(data.month),
      amount: data.amount,
      commissionAmount: data.commissionAmount ?? commissionAmount,
      ownerAmount: data.ownerAmount ?? ownerAmount,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      status: data.status || 'pending',
      notes: data.notes
    },
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const update = async (id: number, data: UpdatePaymentDto, userId: number) => {
  // Verify ownership
  const existingPayment = await getById(id, userId)
  if (!existingPayment) {
    throw new Error('Payment not found or access denied')
  }
  
  const updateData: any = {}

  if (data.amount !== undefined) {
    // Recalculate commission if amount changes
    const payment = await prisma.payment.findUnique({
      where: { id }
    })
    
    if (payment) {
      const { commissionAmount, ownerAmount } = await calculateAmounts(
        payment.contractId,
        data.amount
      )
      updateData.amount = data.amount
      updateData.commissionAmount = data.commissionAmount ?? commissionAmount
      updateData.ownerAmount = data.ownerAmount ?? ownerAmount
    }
  }

  if (data.paymentDate !== undefined) {
    updateData.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null
  }

  if (data.status !== undefined) {
    updateData.status = data.status
    
    // If marking as paid and no payment date, set it to now
    if (data.status === 'paid' && !data.paymentDate && !updateData.paymentDate) {
      updateData.paymentDate = new Date()
    }
  }

  if (data.notes !== undefined) {
    updateData.notes = data.notes
  }

  return await prisma.payment.update({
    where: { id },
    data: updateData,
    include: {
      contract: {
        include: {
          apartment: {
            include: {
              building: true,
              owner: true
            }
          },
          tenant: true
        }
      }
    }
  })
}

export const remove = async (id: number, userId: number) => {
  const payment = await getById(id, userId)
  if (!payment) {
    throw new Error('Payment not found or access denied')
  }
  
  return await prisma.payment.delete({
    where: { id }
  })
}

/**
 * Mark payment as paid
 */
export const markAsPaid = async (id: number, userId: number, paymentDate?: string) => {
  return await update(id, {
    status: 'paid',
    paymentDate: paymentDate || new Date().toISOString()
  }, userId)
}

/**
 * Mark overdue payments
 */
export const markOverduePayments = async (userId: number) => {
  const today = new Date()
  
  const result = await prisma.payment.updateMany({
    where: {
      userId,
      status: 'pending',
      month: {
        lt: today
      }
    },
    data: {
      status: 'overdue'
    }
  })

  return result
}
