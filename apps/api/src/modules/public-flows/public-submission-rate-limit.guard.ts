import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

@Injectable()
export class PublicSubmissionRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      ip?: string;
      params?: Record<string, string>;
      socket?: { remoteAddress?: string };
    }>();
    const windowMs = Number(
      process.env.PUBLIC_SUBMISSION_RATE_LIMIT_WINDOW_MS ?? DEFAULT_WINDOW_MS
    );
    const maxRequests = Number(
      process.env.PUBLIC_SUBMISSION_RATE_LIMIT_MAX ?? DEFAULT_MAX_REQUESTS
    );
    const now = Date.now();
    const key = [
      request.ip ?? request.socket?.remoteAddress ?? "unknown",
      request.params?.companySlug ?? "company",
      request.params?.flowSlug ?? "flow"
    ].join(":");
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      this.cleanup(now);
      return true;
    }

    if (bucket.count >= maxRequests) {
      throw new HttpException(
        "Muitas submissões em pouco tempo. Tente novamente em instantes.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    bucket.count += 1;
    return true;
  }

  private cleanup(now: number) {
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }
}
