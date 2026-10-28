/**
 * The browser translation models: Helsinki-NLP Opus-MT (Apache-2.0), converted for Transformers.js by Xenova.
 * Each direction is its own model, named "<from>-<to>". Every model is pinned to an exact revision so the files
 * can never change under us, and `bytes` is the approximate download (8-bit weights, tokenizer and config) shown
 * before the first use. Languages without a direct model are translated through English (two models).
 */
export interface ModelInfo {
  revision: string;
  bytes: number;
}

export const MODELS: Record<string, ModelInfo> = {
  "ar-en": { revision: "09c7556866400dcc53562ba8d7035119e7d9a2c1", bytes: 117621466 },
  "cs-en": { revision: "c9f7336d1cf49ba5b7a412cba3b86999fa781716", bytes: 116695526 },
  "da-en": { revision: "6496d5e47a016552357be8f06294096609256ac4", bytes: 112558989 },
  "de-en": { revision: "399dfd68706739fffd503f876093e455ae268a06", bytes: 111519745 },
  "en-ar": { revision: "034a684356c19021a187cda4d7f823298b913921", bytes: 117602786 },
  "en-cs": { revision: "ed163ca109a93297e2f055eb3397bd33230141ad", bytes: 116695526 },
  "en-da": { revision: "33862dc071a5cc43e821e60742553c501c587e77", bytes: 112558991 },
  "en-de": { revision: "1ca130c44c4c5441ef16d48aae521a424ab644f7", bytes: 111519780 },
  "en-es": { revision: "4b002a4c7edd54a7ced58877258b87f7efd3f892", bytes: 119377271 },
  "en-fi": { revision: "4e5799273dbd7cce94c1e99cc9d3acb9f191b8eb", bytes: 119429988 },
  "en-fr": { revision: "28726206f80896b90035bd99cccd5cc1e151f916", bytes: 113111733 },
  "en-hi": { revision: "7aad72006a1588a9c3485ed6203aed99eebbc872", bytes: 116657642 },
  "en-hu": { revision: "1b7df958c1bd8f094eff1ce76d536468923ed7e3", bytes: 116699316 },
  "en-id": { revision: "b3b41f654c2fb3286d007dee1da7b0f47fd27d82", bytes: 107915091 },
  "en-it": { revision: "075406e3c8c2c30634d4a1bd8f00c21d9e162011", bytes: 136474044 },
  "en-nl": { revision: "c3a0541231a7329b4492809fc2bd7ab7d2ceb0bc", bytes: 121631416 },
  "en-ro": { revision: "3d816891778276930df2a45cbfb70689b3fe8981", bytes: 113247006 },
  "en-ru": { revision: "e050376e960175e8ddc5cff85025dc8436cddd68", bytes: 117767359 },
  "en-sv": { revision: "33d522d806c041cdebecd549c558d22a2b9b4ea4", bytes: 109758413 },
  "en-uk": { revision: "e6ca587292984b343fd829b6430ed55858496525", bytes: 116526929 },
  "en-vi": { revision: "30bcd461c0d7338ad106b36314d3eedc2d4e998c", bytes: 106645206 },
  "en-zh": { revision: "046f55aec303cdee3e0318604406d4df20f1e8ea", bytes: 119495576 },
  "es-en": { revision: "eadfd7c658a9d8929ac3b8e996b68a68e2c7d480", bytes: 119377236 },
  "fi-en": { revision: "a623e4812687be788e3ab720c8a950ab64704793", bytes: 113395364 },
  "fr-en": { revision: "6b166a182780e118c997879d0ad5be4b53671644", bytes: 113111733 },
  "hi-en": { revision: "99853100ed9d932987a6816e8cf7b1b6742a6116", bytes: 115710176 },
  "hu-en": { revision: "c9e8a7617fb4cb4fca3785c5bb22cfe457cde00b", bytes: 116699316 },
  "id-en": { revision: "c38ef36c843b71177da903442835c3c870975fd6", bytes: 107915093 },
  "it-en": { revision: "fd0b89b9c052adc1f2f64152f555aa17353728be", bytes: 136865393 },
  "ja-en": { revision: "1a906cfaaf7c8f4193f67f5885c082aa6dbd9d16", bytes: 114701000 },
  "ko-en": { revision: "d9fa1ac6008242100fecb4fff9b0a5917a1be81f", bytes: 119601552 },
  "nl-en": { revision: "82c42d95d1508037cbe7172d85fd4e940a2f3584", bytes: 121631418 },
  "pl-en": { revision: "aeaf0e003b045248c28a559a5ce6027b54ebdaba", bytes: 117618083 },
  "ru-en": { revision: "afe8c6c738ec81b6d033fd8f44f9678a639a7c67", bytes: 117767359 },
  "sv-en": { revision: "63a40256869b6a2b29a84e47aa7f03524fa5f3a2", bytes: 109758413 },
  "th-en": { revision: "7f0406b972f742985cfbe3be8f61dead9f1bc0e3", bytes: 117356323 },
  "tr-en": { revision: "78247f41f354af036d24e6f0f8a3d02c6806f96e", bytes: 116552937 },
  "uk-en": { revision: "b2ad6afa424aaeff8913ff350860b7a7b7c0a607", bytes: 116526929 },
  "vi-en": { revision: "541dfd72ec07e8f1563795e0224408ad8d729e80", bytes: 106706880 },
  "zh-en": { revision: "39d480d52a9ea3065a1f117adfe4dbc55de10e6f", bytes: 119495849 },
};
