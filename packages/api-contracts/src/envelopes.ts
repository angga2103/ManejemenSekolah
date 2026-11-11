export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  pagination?: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta: ResponseMeta;
}

export interface PaginatedResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T[];
  meta: ResponseMeta & {
    pagination: {
      page: number;
      limit: number;
      totalRecords: number;
      totalPages: number;
    };
  };
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  errorCode: string;
  details?: ApiErrorDetail[];
  meta: ResponseMeta;
}
