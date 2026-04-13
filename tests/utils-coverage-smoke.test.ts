/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  appendBrokerFilterToURL,
  appendKindToURL,
  appendStageToURL,
  appendThemeToURL,
} from "../src/utils/url-utils";
import { generateRequestId } from "../src/utils/request-id";
import {
  applyErrorInterceptors,
  applyRequestInterceptors,
  applyResponseInterceptors,
  addErrorInterceptor,
  addRequestInterceptor,
  addResponseInterceptor,
} from "../src/utils/interceptors";
import { unwrapAxiosResponse } from "../src/utils/response-utils";
import {
  handleError,
  ApiError,
  ValidationError,
  FinaticError,
} from "../src/utils/error-handling";
import { retryApiCall } from "../src/utils/retry";
import { getCache, generateCacheKey } from "../src/utils/cache";
import { PaginatedData } from "../src/utils/pagination";
import { convertToPlainObject } from "../src/utils/plain-object";
import { coerceEnumValue } from "../src/utils/enum-coercion";
import * as z from "zod";
import { validateParams, numberSchema, stringSchema } from "../src/utils/validation";

jest.mock("p-retry", () => {
  class AbortError extends Error {}
  const pRetry = jest.fn(async (taskFn: any, options: any) => {
    const retries = options.retries ?? 0;
    let attempt = 0;
    while (true) {
      try {
        attempt += 1;
        return await taskFn();
      } catch (err: any) {
        if (err instanceof AbortError) {
          throw err;
        }
        if (attempt > retries) {
          throw err;
        }
      }
    }
  });
  return {
    __esModule: true,
    default: pRetry,
    AbortError,
  };
});

function createPagination<T>(
  items: T[],
  meta: {
    has_more: boolean;
    next_offset: number | null;
    current_offset: number;
    limit: number;
  },
  originalMethod: (params: any) => Promise<any>,
  currentParams: any,
  wrapperInstance: any,
): PaginatedData<T> {
  return new PaginatedData<T>(
    items,
    meta,
    originalMethod,
    currentParams,
    wrapperInstance,
  );
}

describe("Generated SDK utils coverage", () => {
  describe("URL utils", () => {
    beforeEach(() => {
      (global as any).btoa = (str: string) =>
        Buffer.from(str, "utf8").toString("base64");
    });

    it("appendThemeToURL handles string + custom + invalid URL", () => {
      expect(appendThemeToURL("https://example.com", undefined)).toBe(
        "https://example.com",
      );
      expect(appendThemeToURL("https://example.com", "dark")).toContain(
        "theme=dark",
      );
      expect(
        appendThemeToURL("https://example.com", { preset: "solarized" }),
      ).toContain("theme=solarized");

      const customUrl = appendThemeToURL("https://example.com", {
        custom: { a: 1 },
      });
      expect(customUrl).toContain("theme=custom");
      expect(customUrl).toContain("themeObject=");

      expect(appendThemeToURL("not a url", "dark")).toBe("not a url");
    });

    it("appendBrokerFilterToURL and other helpers append parameters", () => {
      expect(
        appendBrokerFilterToURL("https://example.com", undefined),
      ).toBe("https://example.com");
      expect(
        appendBrokerFilterToURL("https://example.com", ["binance"]),
      ).toContain("brokers=");
      expect(appendKindToURL("https://example.com", "broker")).toContain(
        "type=broker",
      );
      expect(appendStageToURL("https://example.com", ["production"])).toContain(
        "stage=production",
      );
      expect(appendKindToURL("not a url", "broker")).toBe("not a url");
    });
  });

  describe("request-id", () => {
    it("generateRequestId returns a UUID-ish string", () => {
      const id = generateRequestId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe("response-utils", () => {
    it("unwrapAxiosResponse returns response.data when present", () => {
      expect(unwrapAxiosResponse({ data: { hello: "world" } })).toEqual({
        hello: "world",
      });
      expect(unwrapAxiosResponse(123)).toBe(123);
    });
  });

  describe("error-handling", () => {
    it("handleError maps 422 -> ValidationError", () => {
      const err: any = {
        response: {
          status: 422,
          data: {
            error: {
              type: "VALIDATION",
              code: "MISSING_REQUIRED",
              trace_id: "t1",
              details: {},
              message: "bad input",
            },
          },
        },
      };
      const handled = handleError(err, "req-1");
      expect(handled).toBeInstanceOf(ValidationError);
      expect((handled as ValidationError).statusCode).toBe(422);
      expect(handled.message).toBe("bad input");
    });

    it("handleError maps >=400 -> ApiError", () => {
      const err: any = {
        status: 401,
        data: { error: { message: "nope", code: "INVALID_TOKEN" } },
      };
      const handled = handleError(err);
      expect(handled).toBeInstanceOf(ApiError);
      expect((handled as ApiError).statusCode).toBe(401);
    });

    it("handleError maps other -> FinaticError", () => {
      const err: any = { status: 300, message: "strange" };
      const handled = handleError(err);
      expect(handled).toBeInstanceOf(FinaticError);
    });
  });

  describe("interceptors", () => {
    it("apply request/response/error interceptors obey sdk config flags", async () => {
      const cfg: any = {
        requestInterceptorsEnabled: true,
        responseInterceptorsEnabled: true,
      };
      addRequestInterceptor((c) => ({
        ...c,
        headers: { ...(c as any).headers, "x-a": "b" },
      }));
      addResponseInterceptor((r) => ({
        ...r,
        data: { ...(r as any).data, ok: true },
      }));
      addErrorInterceptor((e) => ({ ...e, handled: true }));

      const reqOut = await applyRequestInterceptors(
        { headers: {} } as any,
        cfg,
      );
      expect((reqOut as any).headers["x-a"]).toBe("b");

      const respOut = await applyResponseInterceptors(
        { data: { hi: 1 } } as any,
        cfg,
      );
      expect(respOut.data.ok).toBe(true);

      await expect(
        applyErrorInterceptors({ err: "x" } as any, {
          responseInterceptorsEnabled: false,
        } as any),
      ).rejects.toBeTruthy();

      const errOut = await applyErrorInterceptors({ err: "x" } as any, cfg);
      expect(errOut.handled).toBe(true);
    });
  });

  describe("retry", () => {
    it("retries on configured status and aborts when status is not retryable", async () => {
      let attempt = 0;
      const fn = jest.fn(async () => {
        attempt += 1;
        if (attempt === 1) {
          const e: any = new Error("fail");
          e.response = { status: 500 };
          throw e;
        }
        return "ok";
      });

      const ok = await retryApiCall(
        fn,
        { maxRetries: 1, retryDelay: 0, retryMaxDelay: 0 } as any,
        { retryCount: 1, retryDelay: 0, retryMaxDelay: 0 } as any,
      );
      expect(ok).toBe("ok");
      expect(fn).toHaveBeenCalled();

      const abortFn = jest.fn(async () => {
        const e: any = new Error("unauth");
        e.response = { status: 401 };
        throw e;
      });

      await expect(
        retryApiCall(
          abortFn,
          { maxRetries: 3, retryDelay: 0, retryMaxDelay: 0 } as any,
          { retryCount: 1, retryDelay: 0, retryMaxDelay: 0 } as any,
        ),
      ).rejects.toBeTruthy();
    });
  });

  describe("cache", () => {
    it("getCache/get/generateCacheKey exercise cache branches", () => {
      (global as any).window = {
        setInterval: jest.fn(() => 123),
        clearInterval: jest.fn(),
      };

      const cache = getCache({
        cacheEnabled: true,
        cacheMaxSize: 2,
        cacheTtl: 1,
        cacheKeyInclude: ["method", "path", "query", "body"],
      } as any);
      expect(cache).not.toBeNull();

      const c: any = cache;
      const key1 = generateCacheKey(
        "m",
        "/p",
        { query: { b: 2, a: 1 }, body: { x: 1 } } as any,
        {
          cacheEnabled: true,
          cacheKeyInclude: ["method", "path", "query", "body"],
        } as any,
      );
      expect(key1).toContain("method:m");

      c.set("k1", "v1", 1);
      expect(c.get("k1")).toBe("v1");
      c.set("k2", "v2", 1);
      // NodeCache doesn't evict LRU; with maxKeys >= 2 we should keep both.
      expect(c.get("k1")).toBe("v1");

      expect(c.has("k2")).toBe(true);
      expect(c.del("k2")).toBe(1);
      expect(c.del("missing")).toBe(0);
      // k1 should still exist (we didn't evict it in NodeCache).
      expect(c.keys().length).toBe(1);

      if (typeof c.flushAll === "function") {
        c.flushAll();
      }
    });

    it("returns null when cache is disabled", () => {
      expect(getCache({ cacheEnabled: false } as any)).toBeNull();
    });
  });

  describe("pagination", () => {
    it("PaginatedData methods cover next/prev/first/last page + throw branches", async () => {
      const wrapper = {};

      const originalMethod: (params: any) => Promise<any> = jest.fn(
        async (params: any) => {
        const offset = params.offset;
        if (offset === 0) {
          const meta = {
            has_more: true,
            next_offset: 2,
            current_offset: 0,
            limit: 2,
          };
          const next = createPagination([1, 2], meta, originalMethod, params, wrapper);
          return { success: { data: next }, error: null, warning: null };
        }
        if (offset === 2) {
          const meta = {
            has_more: false,
            next_offset: null,
            current_offset: 2,
            limit: 2,
          };
          const page2 = createPagination([3], meta, originalMethod, params, wrapper);
          return { success: { data: page2 }, error: null, warning: null };
        }
        return { success: false };
        },
      );

      const meta0 = {
        has_more: true,
        next_offset: 2,
        current_offset: 0,
        limit: 2,
      };
      const initial = createPagination(
        [1, 2],
        meta0,
        originalMethod,
        { offset: 0, limit: 2 },
        wrapper,
      );

      const nextPage = await initial.nextPage();
      expect(nextPage.length).toBe(1);

      const prevPage = await nextPage.prevPage();
      expect(prevPage.length).toBe(2);

      const first = await nextPage.firstPage();
      expect(first.length).toBe(2);

      const last = await initial.lastPage();
      expect(last.length).toBe(1);

      const metaNoMore = {
        has_more: false,
        next_offset: null,
        current_offset: 0,
        limit: 2,
      };
      const noMore = createPagination(
        [1, 2],
        metaNoMore,
        originalMethod,
        { offset: 0, limit: 2 },
        wrapper,
      );
      await expect(noMore.nextPage()).rejects.toThrow("No more pages available");

      const metaNullNext = {
        has_more: true,
        next_offset: null,
        current_offset: 0,
        limit: 2,
      };
      const nullNext = createPagination(
        [1, 2],
        metaNullNext,
        originalMethod,
        { offset: 0, limit: 2 },
        wrapper,
      );
      await expect(nullNext.nextPage()).rejects.toThrow("Next offset is null");
    });
  });

  describe("plain-object", () => {
    it("convertToPlainObject handles primitives, arrays, plain objects, class instances", () => {
      expect(convertToPlainObject(null)).toBeNull();
      expect(convertToPlainObject(undefined)).toBeUndefined();
      expect(convertToPlainObject([1, { a: 2 }])).toEqual([1, { a: 2 }]);
      expect(convertToPlainObject({ _id: "x", y: 1 })).toEqual({ y: 1 });
      expect(convertToPlainObject({ metadata: null, z: 1 })).toEqual({ z: 1 });
      class Box {
        v = 3;
      }
      expect(convertToPlainObject(new Box())).toEqual({ v: 3 });
    });
  });

  describe("enum-coercion", () => {
    const Status = { Open: "open", Closed: "closed" } as const;
    it("coerceEnumValue matches value and key case-insensitively", () => {
      expect(coerceEnumValue(undefined, Status, "s")).toBeUndefined();
      expect(coerceEnumValue("OPEN", Status, "s")).toBe("open");
      expect(coerceEnumValue("closed", Status, "s")).toBe("closed");
      expect(() => coerceEnumValue("nope", Status, "s")).toThrow("Invalid s");
    });
  });

  describe("validation helpers", () => {
    it("validateParams and schema helpers", () => {
      const schema = z.object({ n: z.number() });
      const cfgOff = { validationEnabled: false } as any;
      expect(validateParams(schema, { n: 1 }, cfgOff)).toEqual({ n: 1 });

      const cfgOn = { validationEnabled: true, validationStrict: true } as any;
      expect(validateParams(schema, { n: 2 }, cfgOn)).toEqual({ n: 2 });
      expect(() => validateParams(schema, { n: "bad" } as any, cfgOn)).toThrow();

      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const cfgLoose = { validationEnabled: true, validationStrict: false } as any;
      validateParams(schema, { n: "bad" } as any, cfgLoose);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();

      expect(numberSchema(1, 10, 5).parse(undefined)).toBe(5);
      expect(stringSchema(1, 10, "hi").parse(undefined)).toBe("hi");
    });
  });
});

