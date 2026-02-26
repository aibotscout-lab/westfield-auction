export default function TermsAndConditions() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 25, 2026</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold mb-2">Westfield 1st Ward Silent Auction</h2>
          <p>By using this auction platform, you agree to the following terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Program Description</h2>
          <p>The Westfield 1st Ward Silent Auction is a church fundraising event. This platform allows registered participants to place bids on auction items and receive notifications about their bid status.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">SMS Messaging Terms</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>By registering, you consent to receive a one-time SMS verification code</li>
            <li>You may opt in to receive outbid notifications via the toggle on the auction page</li>
            <li>Message frequency varies based on auction activity (typically 1-10 messages per auction event)</li>
            <li>Message and data rates may apply</li>
            <li>Reply <strong>STOP</strong> to opt out of notifications at any time</li>
            <li>Reply <strong>HELP</strong> for support information</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Bidding</h2>
          <p>All bids are binding. If you win an item, you agree to complete payment at the end of the auction. All sales are final.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p>For support, contact the Westfield 1st Ward auction organizers or reply HELP to any SMS message.</p>
        </section>
      </div>
    </div>
  );
}
