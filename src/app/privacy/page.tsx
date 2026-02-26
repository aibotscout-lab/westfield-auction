export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: February 25, 2026</p>
      
      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold mb-2">What We Collect</h2>
          <p>When you register for the Westfield 1st Ward Silent Auction, we collect your name and phone number to identify your bids and send you auction-related notifications.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To verify your identity via SMS one-time passcode</li>
            <li>To display your bidder name on auction items (unless you choose anonymous bidding)</li>
            <li>To send outbid notifications if you opt in</li>
            <li>To contact winners after the auction</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Data Sharing</h2>
          <p>We do not sell, share, or distribute your personal information to any third parties. Your data is only used for auction purposes by the Westfield 1st Ward.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">SMS Messages</h2>
          <p>You may receive SMS messages for login verification and outbid notifications (if opted in). Message and data rates may apply. Message frequency varies based on auction activity. Reply STOP to opt out of notifications at any time.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Data Retention</h2>
          <p>Auction data is retained only for the duration of the event and a reasonable period afterward for record-keeping. Data is deleted after the auction concludes.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p>For questions about this policy, contact the Westfield 1st Ward auction organizers.</p>
        </section>
      </div>
    </div>
  );
}
