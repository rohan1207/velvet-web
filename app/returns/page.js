import Link from 'next/link';

export const metadata = {
  title: 'Returns, Exchanges & Refunds Policy',
  description:
    'Velvet Shell returns, exchanges and refunds policy — windows, eligibility, shipping charges and how to raise a request.',
};

const linkClass =
  'font-medium text-burgundy underline decoration-burgundy/40 underline-offset-4 hover:decoration-burgundy';

export default function ReturnsPage() {
  return (
    <div className="bg-ivory pt-page pb-24">
      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-10 md:pt-12">
        <p className="font-label text-gold">Velvet Shell</p>
        <h1 className="font-display mt-4 text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[0.98] tracking-[-0.03em] text-ink">
          Returns, Exchanges &amp; Refunds Policy
        </h1>

        <div className="mt-8 space-y-5 text-[15px] font-light leading-[1.8] text-ink/80">
          <p>
            At Velvet Shell, we take great care in selecting, checking and packaging every piece of
            jewellery. We want you to be happy with your purchase.
          </p>
          <p>
            If something isn&apos;t right, please read our policy below to understand how returns,
            exchanges and refunds work.
          </p>
        </div>

        <div className="mt-14 space-y-14">
          <Section number="01" title="Return Window">
            <p>
              We accept return requests within 48 hours from the date of delivery, subject to the
              eligibility conditions mentioned below.
            </p>
            <p>
              Returns for change of mind, design preference or other non-defect-related reasons are
              accepted only if the product is unused, unworn and in its original condition.
            </p>
            <p>
              To initiate a return, please contact us at{' '}
              <a href="mailto:sales@velvetshell.in?subject=Return%20request" className={linkClass}>
                sales@velvetshell.in
              </a>{' '}
              with your order number and reason for the return.
            </p>
          </Section>

          <Section number="02" title="Return Eligibility">
            <p>To qualify for a return:</p>
            <BulletList
              items={[
                'The jewellery must be unused, unworn and unaltered.',
                'The product must be returned in its original condition, without scratches, dents, bends, signs of wear or other damage.',
                'Original packaging, tags, authenticity cards, certificates, accessories and any complimentary items supplied with the order must be returned.',
                'The product must match the item originally delivered.',
                'The return request must be raised within the applicable return window.',
              ]}
            />
            <p>
              All returned products are subject to a quality inspection before a return or refund is
              approved.
            </p>
            <p>
              Products showing signs of use, damage caused after delivery, alterations or missing
              components may not qualify for a change-of-mind return.
            </p>
            <p>
              <span className="font-medium text-ink">Important:</span> These conditions do not
              restrict your statutory rights in relation to defective, damaged, incorrect, spurious
              or misdescribed products.
            </p>
          </Section>

          <Section number="03" title="Exchange Policy">
            <p>
              We accept exchange requests within 48 hours from the date of delivery, subject to
              product availability and inspection.
            </p>
            <p>Exchanges may be requested for:</p>
            <BulletList
              items={[
                'A different design.',
                'A different size or variant, where available.',
                'Another product of equal or higher value.',
              ]}
            />
            <p>
              For exchanges involving a higher-priced product, the customer must pay the difference
              before the replacement is dispatched.
            </p>
            <p>
              If the replacement product is of lower value, the difference will be refunded or
              otherwise settled as mutually agreed, subject to applicable law.
            </p>
            <p>Exchange requests are subject to the following:</p>
            <BulletList
              items={[
                'The original product must be unused, unworn and in its original condition.',
                'All original packaging and accompanying items must be returned.',
                'The requested replacement must be available in stock.',
                'Only one preference-based exchange will be permitted per order.',
              ]}
            />
            <p>
              If the selected replacement is unavailable, our team will contact you to discuss an
              alternative or another appropriate resolution.
            </p>
          </Section>

          <Section number="04" title="Damaged, Defective or Incorrect Products">
            <p>
              We take quality checks seriously. However, if you receive a damaged, defective or
              incorrect product, please notify us as soon as possible, preferably within 48 hours of
              delivery.
            </p>
            <p>Please share:</p>
            <BulletList
              items={[
                'Your order number.',
                'Clear photographs of the product.',
                'Photographs of the outer packaging and shipping label, where relevant.',
                'An unboxing video, if available.',
              ]}
            />
            <p>
              Our team will review the complaint and arrange an appropriate resolution, which may
              include a replacement, repair or refund, depending on the nature of the issue and
              applicable law.
            </p>
            <p>
              There will be no return shipping charge to the customer for a verified product defect,
              damage or incorrect item attributable to Velvet Shell.
            </p>
            <p>
              The 48-hour reporting period is requested to help us investigate courier and packaging
              issues promptly. It does not take away any consumer rights available under applicable
              law.
            </p>
          </Section>

          <Section number="05" title="Non-Returnable Items">
            <p>
              The following are not eligible for change-of-mind returns or preference-based
              exchanges:
            </p>
            <BulletList
              items={[
                'Customised or personalised jewellery.',
                "Products altered, resized or modified at the customer's request.",
                'Products that have been worn, used or damaged after delivery.',
                'Products missing original tags, packaging or accompanying components.',
                'Products purchased as part of a clearly identified final-sale or clearance offer, where this exclusion was disclosed before purchase.',
              ]}
            />
            <p>
              These exclusions do not apply where the product is defective, damaged, incorrect,
              spurious or materially different from what was advertised or agreed to, or where
              applicable law otherwise requires a remedy.
            </p>
          </Section>

          <Section number="06" title="Return Shipping Charges">
            <p>For change-of-mind returns, the customer will bear the actual return shipping cost.</p>
            <p>
              For preference-based exchanges, the customer will bear the applicable return shipping
              and replacement delivery charges. These charges will be communicated before the
              exchange is processed.
            </p>
            <p>
              If an item is confirmed to be defective, damaged during delivery, or incorrectly
              supplied, Velvet Shell will arrange a suitable replacement or refund, including any
              applicable return shipping costs.
            </p>
            <p>
              Where a reverse pickup is unavailable at the customer&apos;s PIN code, our team will
              provide instructions for self-shipping the product.
            </p>
            <p>
              Please do not send any product back without first receiving return authorisation and
              the return address from our team.
            </p>
          </Section>

          <Section number="07" title="Refund Policy">
            <p>Refunds will be processed after:</p>
            <NumberedList
              items={[
                'The return request has been reviewed and approved.',
                'The product has been received by Velvet Shell.',
                'The product has passed the applicable quality inspection.',
                'The refund amount has been verified against the original order.',
              ]}
            />
            <p>
              Approved refunds will be initiated within 5-7 working days after receipt and successful
              inspection of the returned product.
            </p>
            <BulletList
              items={[
                'Prepaid orders: Refunds will be initiated to the original payment method.',
                'Cash on Delivery orders: Refunds will be processed through an approved bank account or UPI details provided by the customer.',
                'Partial returns: The refund will be calculated based on the actual amount paid for the returned product, after applying any applicable order-level discounts or promotional adjustments.',
              ]}
            />
            <p>
              The time taken for the refunded amount to appear in the customer&apos;s account may
              vary depending on the bank, card issuer or payment service provider.
            </p>
            <p>
              Refund processing times may vary depending on the customer&apos;s bank, card issuer or
              payment service provider.
            </p>
            <p>
              Shipping charges paid at checkout will be handled in accordance with applicable law and
              the circumstances of the return.
            </p>
          </Section>

          <Section number="08" title="How to Initiate a Return or Exchange">
            <p>Please follow these steps:</p>
            <NumberedList
              items={[
                <>
                  Contact us at{' '}
                  <a href="mailto:sales@velvetshell.in?subject=Return%20or%20exchange" className={linkClass}>
                    sales@velvetshell.in
                  </a>
                  .
                </>,
                'Share your order number and the product(s) you wish to return or exchange.',
                'Mention the reason for your request.',
                'Share photographs or other information requested by our team, where relevant.',
                'Wait for return authorisation and shipping instructions.',
                'Pack the product securely with all original components and documentation.',
                'Send the product using the approved pickup or self-shipping arrangement.',
              ]}
            />
            <p>
              Products sent back without prior communication or authorisation may experience delays
              in processing.
            </p>
          </Section>

          <Section number="09" title="Important Shipping Instructions">
            <p>We recommend checking the parcel at the time of delivery.</p>
            <p>
              If the outer package appears visibly tampered with or severely damaged, please document
              the condition and contact us immediately. Where possible, refuse delivery of a visibly
              compromised shipment and notify our support team.
            </p>
            <p>Please retain the original packaging until you have checked your order.</p>
            <p>
              We recommend recording an unboxing video from the point of opening the sealed parcel.
              This can help us investigate missing, damaged or incorrect item claims.
            </p>
          </Section>

          <Section number="10" title="Contact Us">
            <p>For return, exchange or refund assistance:</p>
            <div className="space-y-1 text-ink/80">
              <p>
                Brand: <span className="text-ink">Velvet Shell</span>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:sales@velvetshell.in" className={linkClass}>
                  sales@velvetshell.in
                </a>
              </p>
              <p>
                WhatsApp/Phone:{' '}
                <a href="tel:+919096205849" className={linkClass}>
                  9096205849
                </a>
              </p>
            </div>
            <p className="mt-6">
              For complaints that require escalation, please contact our designated Grievance
              Officer:
            </p>
            <div className="mt-2 space-y-1 text-ink/80">
              <p>
                Name: <span className="text-ink">Smita Eghe</span>
              </p>
              <p>
                Email:{' '}
                <a href="mailto:sales@velvetshell.in" className={linkClass}>
                  sales@velvetshell.in
                </a>
              </p>
              <p>Working Hours: 10 AM to 7 PM</p>
            </div>
            <p className="mt-6">
              We aim to acknowledge consumer complaints within 48 hours and address them within the
              timelines prescribed under applicable law.
            </p>
          </Section>
        </div>

        <div className="mt-14 border-t border-ink/10 pt-10">
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 font-label text-[11px] tracking-[0.18em] text-burgundy transition-opacity hover:opacity-70"
          >
            Contact Us
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <section className="border-t border-ink/10 pt-10">
      <div className="flex items-baseline gap-4">
        <span className="font-label text-[10px] text-gold">{number}</span>
        <h2 className="font-display text-2xl tracking-[-0.02em] text-ink md:text-3xl">{title}</h2>
      </div>
      <div className="mt-6 space-y-4 text-[15px] font-light leading-[1.8] text-ink/80">{children}</div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="list-none space-y-2.5">
      {items.map((item) => (
        <li key={typeof item === 'string' ? item : String(item)} className="flex gap-3">
          <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy/70" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }) {
  return (
    <ol className="list-none space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="font-label mt-0.5 shrink-0 text-[10px] text-gold">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
