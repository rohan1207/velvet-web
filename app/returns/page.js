import Legal from '@/components/Legal';

export const metadata = {
  title: 'Returns, Refunds & Exchanges',
  description:
    'Velvet Shell return, exchange and refund policy — request windows, inspection and refund timelines.',
};

export default function ReturnsPage() {
  return (
    <Legal title="Returns, Refunds & Exchanges">
      <p>
        If you need to change or cancel an order, write to us as soon as possible. Once an order has
        been processed or dispatched, changes may not be possible.
      </p>

      <h2 className="font-display pt-4 text-2xl text-ink md:text-3xl">1. Return Policy</h2>
      <p>
        We accept return requests within <strong className="font-medium text-ink">48 hours</strong>{' '}
        from the date of delivery.
      </p>
      <p>
        To begin a return, email{' '}
        <a
          href="mailto:sales@velvetshell.in?subject=Return%20request"
          className="font-medium text-burgundy underline decoration-burgundy/40 underline-offset-4 hover:decoration-burgundy"
        >
          sales@velvetshell.in
        </a>{' '}
        with your order number and clear photographs of the product and packaging. Please contact us
        before sending anything back. Our working hours are 10 am to 7 pm (IST).
      </p>
      <p>
        Returned products must be unused, in their original condition, and returned with original
        packaging and tags where supplied. Items that show signs of wear, alteration, damage or
        misuse may not be accepted.
      </p>

      <h2 className="font-display pt-4 text-2xl text-ink md:text-3xl">2. Exchange Policy</h2>
      <p>
        We accept exchange requests within <strong className="font-medium text-ink">48 hours</strong>{' '}
        from the date of delivery.
      </p>
      <p>
        Exchange eligibility depends on product availability and the reason for exchange. Please
        contact us before sending an item back. Size, colour or style exchanges are subject to stock
        and approval after inspection.
      </p>

      <h2 className="font-display pt-4 text-2xl text-ink md:text-3xl">3. Refunds</h2>
      <p>
        If your return is approved, we will initiate a refund to your original payment method within
        5–7 business days of receiving and inspecting the returned product.
      </p>
      <p>
        The time taken for the amount to reflect in your account may depend on your bank or payment
        provider.
      </p>
      <p>
        Where an item is confirmed to be defective, damaged during delivery or incorrectly supplied,
        Velvet Shell will arrange an appropriate replacement or refund, including applicable return
        shipping costs.
      </p>
      <p>
        If you receive a damaged or incorrect piece, contact us promptly with your order number and
        clear photographs of the jewellery and packaging. We will review it and tell you the next
        step.
      </p>
    </Legal>
  );
}
