import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    
    const [
      totalBuildings,
      totalApartments,
      availableApartments,
      rentedApartments,
      apartmentsForSale,
      totalTenants,
      totalOwners,
      activeContracts,
      independentApartments,
      totalPayments,
      pendingPayments,
      overduePayments,
      paidThisMonth
    ] = await Promise.all([
      prisma.building.count({ where: { userId } }),
      prisma.apartment.count({ where: { building: { userId } } }),
      prisma.apartment.count({ where: { status: 'disponible', building: { userId } } }),
      prisma.apartment.count({ where: { status: 'alquilado', building: { userId } } }),
      prisma.apartment.count({ where: { saleStatus: 'en_venta', building: { userId } } }),
      prisma.tenant.count({ where: { userId } }),
      prisma.owner.count({ where: { userId } }),
      prisma.contract.count({
        where: {
          userId,
          endDate: {
            gte: today
          }
        }
      }),
      prisma.apartment.count({ where: { buildingId: null, owner: { userId } } }),
      prisma.payment.count({ where: { userId } }),
      prisma.payment.count({ where: { userId, status: 'pending' } }),
      prisma.payment.count({ 
        where: { 
          userId,
          status: 'pending',
          month: { lt: today }
        } 
      }),
      prisma.payment.count({
        where: {
          userId,
          status: 'paid',
          paymentDate: { gte: currentMonth }
        }
      })
    ])

    // Calcular área total
    const apartments = await prisma.apartment.findMany({
      where: { building: { userId } },
      select: { area: true }
    })
    const totalArea = apartments.reduce((sum: number, apt: { area: number }) => sum + apt.area, 0)

    // Calcular totales de pagos
    const paymentsData = await prisma.payment.aggregate({
      _sum: {
        amount: true,
        commissionAmount: true
      },
      where: {
        userId,
        status: 'paid'
      }
    })

    const pendingPaymentsData = await prisma.payment.aggregate({
      _sum: {
        amount: true
      },
      where: {
        userId,
        status: 'pending'
      }
    })

    res.json({
      totalBuildings,
      totalApartments,
      availableApartments,
      rentedApartments,
      apartmentsForSale,
      totalArea,
      totalTenants,
      totalOwners,
      activeContracts,
      independentApartments,
      totalPayments,
      pendingPayments,
      overduePayments,
      paidThisMonth,
      totalRevenue: paymentsData._sum.amount || 0,
      totalCommissions: paymentsData._sum.commissionAmount || 0,
      pendingAmount: pendingPaymentsData._sum.amount || 0
    })
  } catch (error) {
    next(error)
  }
}
