-- Function to release all expired pending orders in a single transaction.
-- Moves qty from reserved back to available for each order_item,
-- then sets the order status to 'EXPIRED'.

create or replace function public.release_expired_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_item record;
  v_count integer := 0;
begin
  -- Lock and iterate expired pending orders
  for v_order in
    select id
    from public.orders
    where status = 'PENDING_PAYMENT'
      and expires_at < timezone('utc'::text, now())
    for update skip locked
  loop
    -- Release inventory for each item in this order
    for v_item in
      select listing_id, quantity
      from public.order_items
      where order_id = v_order.id
    loop
      update public.listings
      set
        qty_available = qty_available + v_item.quantity,
        qty_reserved  = greatest(0, qty_reserved - v_item.quantity)
      where id = v_item.listing_id;
    end loop;

    -- Mark order as expired
    update public.orders
    set status = 'EXPIRED'
    where id = v_order.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
