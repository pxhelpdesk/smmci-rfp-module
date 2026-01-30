<div class="js-cookie-consent cookie-consent fixed bottom-0 inset-x-0 pb-2 z-50">
    <div class="max-w-7xl mx-auto px-6">
        <div class="p-4 md:p-2 rounded-lg bg-[oklch(0.95_0.01_155)]">
            <div class="flex items-center justify-between flex-wrap">
                <div class="max-w-full flex-1 items-center md:w-0 md:inline">
                    <p class="md:ml-3 text-[oklch(0.27_0.18_155)] cookie-consent__message">
                        {!! trans('cookie-consent::texts.message') !!}
                    </p>
                </div>
                <div class="mt-2 flex-shrink-0 w-full sm:mt-0 sm:w-auto">
                    <button class="js-cookie-consent-agree cookie-consent__agree cursor-pointer flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-[oklch(0.98_0_0)] bg-[oklch(0.35_0.2_155)] hover:bg-[oklch(0.4_0.2_155)]">
                        {{ trans('cookie-consent::texts.agree') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
