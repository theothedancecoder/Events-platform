import Search from '@/components/ui/shared/Search'
import { IOrderItem } from '@/lib/mongodb/database/models/order.model'
import { formatDateTime } from '@/lib/utils'
import { formatPrice } from '@/lib/utils/currency'
import { SearchParamProps } from '@/types'
import { getOrdersByEvent } from '@/lib/actions/order.actions'

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

const Orders = async ({ searchParams }: Props) => {
  const params = await Promise.resolve(searchParams);
  const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  const searchText = typeof params?.query === 'string' ? params.query : '';

  console.log('Fetching orders for event:', eventId);

  try {
    const orders = await getOrdersByEvent({ 
      eventId, 
      searchString: searchText 
    })

    // Convert ObjectIds to strings and ensure all data is serializable
    const serializedOrders = orders?.map(order => ({
      ...order,
      _id: order._id.toString(),
      createdAt: new Date(order.createdAt).toISOString()
    })) || []

    console.log('Orders fetched successfully:', {
      count: serializedOrders.length,
      firstOrder: serializedOrders[0] ? {
        id: serializedOrders[0]._id,
        event: serializedOrders[0].eventTitle,
        buyer: serializedOrders[0].buyer,
        amount: serializedOrders[0].totalAmount
      } : null
    });

    return (
      <>
        <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
          <h3 className="wrapper h3-bold text-center sm:text-left">Orders</h3>
        </section>

        <section className="wrapper mt-8">
          <Search placeholder="Search buyer name..." />
        </section>

        <section className="wrapper overflow-x-auto">
          <table className="w-full border-collapse border-t">
            <thead>
              <tr className="p-medium-14 border-b text-grey-500">
                <th className="min-w-[250px] py-3 text-left">Order ID</th>
                <th className="min-w-[200px] flex-1 py-3 pr-4 text-left">Event Title</th>
                <th className="min-w-[150px] py-3 text-left">Buyer</th>
                <th className="min-w-[100px] py-3 text-left">Created</th>
                <th className="min-w-[100px] py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {!serializedOrders || serializedOrders.length === 0 ? (
                <tr className="border-b">
                  <td colSpan={5} className="py-4 text-center text-gray-500">
                    No orders found for this event.
                  </td>
                </tr>
              ) : (
                <>
                  {serializedOrders.map((row: IOrderItem) => (
                    <tr
                      key={row._id}
                      className="p-regular-14 lg:p-regular-16 border-b"
                      style={{ boxSizing: 'border-box' }}>
                      <td className="min-w-[250px] py-4 text-primary-500">{row._id}</td>
                      <td className="min-w-[200px] flex-1 py-4 pr-4">{row.eventTitle}</td>
                      <td className="min-w-[150px] py-4">{row.buyer}</td>
                      <td className="min-w-[100px] py-4">
                        {formatDateTime(row.createdAt).dateTime}
                      </td>
                      <td className="min-w-[100px] py-4 text-right">
                        {formatPrice(row.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </section>
      </>
    )
  } catch (error) {
    console.error('Error in Orders page:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h3 className="h3-bold text-grey-600">Something went wrong</h3>
        <p className="text-grey-600">Please try again later</p>
      </div>
    )
  }
}

export default Orders
