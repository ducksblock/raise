export interface Profile {
  email: string,
  groups: string[],
  issuedAt: number,
  expiresAt: number,
}

export interface Fundraiser {
  id: string,
  fundraiserName: string,
  activeFrom: number,
  activeTo: number | null,
  paused: boolean,
  goal: number,
  totalRaised: number,
  donationsCount: number,
  matchFundingRate: number,
  matchFundingPerDonationLimit: number | null,
  matchFundingRemaining: number | null,
  minimumDonationAmount: number | null,
  groupsWithAccess: string[],
}

export interface Donation {
  id: string,
  fundraiserId: string,
  donorName: string,
  donorEmail: string,
  createdAt: number,
  address: string | null,
  giftAid: boolean,
  comment: string | null,
  donationAmount: number,
  matchFundingAmount: number,
  contributionAmount: number,
  payments: { at: number, amount: number }[],
  paymentMethod: "card",
  paymentGatewayId: string | null,
  charity: string,
  overallPublic: boolean,
  namePublic: boolean,
  commentPublic: boolean,
  donationAmountPublic: boolean,
}
