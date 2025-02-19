import { get, post } from "@toruslabs/http-helpers";
import { LANGUAGE_TYPE } from "@toruslabs/openlogin-utils";
import { log, LoginMethodConfig, WALLET_ADAPTERS } from "@web3auth/base";

import { OPENLOGIN_PROVIDERS, OPENLOGIN_PROVIDERS_NAMES } from "./config";

export const getAdapterSocialLogins = (adapterName: string, loginMethodsConfig: LoginMethodConfig = {}): LoginMethodConfig => {
  const finalLoginMethodsConfig: LoginMethodConfig = {};
  if (adapterName === WALLET_ADAPTERS.OPENLOGIN) {
    OPENLOGIN_PROVIDERS.forEach((loginMethod) => {
      const currentLoginMethodConfig = loginMethodsConfig[loginMethod] || {
        name: OPENLOGIN_PROVIDERS_NAMES[loginMethod],
        showOnMobile: true,
        showOnModal: true,
        showOnDesktop: true,
      };
      finalLoginMethodsConfig[loginMethod] = { ...currentLoginMethodConfig };
    });
    log.debug("OpenLogin login method ui config", finalLoginMethodsConfig);
  } else {
    throw new Error(`${adapterName} is not a valid adapter`);
  }
  return finalLoginMethodsConfig;
};

export async function validateImageUrl(url: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      resolve(true);
    } else {
      img.addEventListener("load", () => {
        resolve(true);
      });
      img.addEventListener("error", () => {
        reject();
      });
    }
  });
}

export async function getNetworkIconId(ticker: string): Promise<string> {
  const fallbackId = "network-default";
  if (!ticker) return fallbackId;
  try {
    const url = `https://images.web3auth.io/network-${ticker.toLowerCase()}.svg`;
    const isValid = await validateImageUrl(url);
    if (isValid) {
      return `network-${ticker.toLowerCase()}`;
    }
    return fallbackId;
  } catch {
    return fallbackId;
  }
}

export const passwordlessBackendUrl = "https://api-passwordless.web3auth.io";

export const getUserCountry = async (): Promise<{ country: string; dialCode: string } | null> => {
  try {
    const result = await get<{ data: { country: string; dial_code: string } }>(`${passwordlessBackendUrl}/api/v3/user/location`);
    if (result && result.data.country) return { country: result.data.country, dialCode: result.data.dial_code };
    return null;
  } catch (error) {
    log.error("error getting user country", error);
    return null;
  }
};

export const validatePhoneNumber = async (phoneNumber: string): Promise<string | boolean> => {
  try {
    const result = await post<{ success: boolean; parsed_number: string }>(`${passwordlessBackendUrl}/api/v3/phone_number/validate`, {
      phone_number: phoneNumber,
    });
    if (result && result.success) return result.parsed_number;
    return false;
  } catch (error: unknown) {
    log.error("error validating phone number", error);
    if ((error as Response).status === 400) {
      return false;
    }
    // sending true because we don't want the user to be stuck on a flow
    // if there is an error with the api or something went wrong.
    return true;
  }
};

export const languageMap: Record<LANGUAGE_TYPE, string> = {
  en: "english",
  de: "german",
  ja: "japanese",
  ko: "korean",
  zh: "mandarin",
  es: "spanish",
  fr: "french",
  pt: "portuguese",
  nl: "dutch",
  tr: "turkish",
};

interface NavigatorLanguage {
  userLanguage?: string;
}

export const getUserLanguage = (defaultLanguage: string | undefined): LANGUAGE_TYPE => {
  let userLanguage = defaultLanguage;
  if (!userLanguage) {
    const browserLanguage =
      typeof window !== "undefined" ? (window.navigator as NavigatorLanguage).userLanguage || window.navigator.language || "en-US" : "en-US";
    userLanguage = browserLanguage.split("-")[0];
  }
  return Object.prototype.hasOwnProperty.call(languageMap, userLanguage) ? (userLanguage as LANGUAGE_TYPE) : "en";
};
