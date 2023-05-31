export type NeonPagination = {
  currentPage: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: string;
  totalPages: number;
  totalResults: number;
};

export type NARItem = {
  'NAR#': string;
  'Account ID': string;
  'Account Last Modified Date/Time': string;
  'First Name': string;
  'Membership Expiration Date': string;
  HPR: string;
  'Last Name': string;
};

export type NARPage<T> = {
  pagination: NeonPagination;
  searchResults: T[];
};
