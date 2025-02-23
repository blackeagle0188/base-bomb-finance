import { Box, Flex, InfoIcon, RowBetween, Text, TooltipText, useTooltip } from '@pancakeswap/uikit'
import { CryptoCard } from 'components/Card'
import { FiatOnRampModalButton } from 'components/FiatOnRampModal/FiatOnRampModal'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRefValue } from 'views/BuyCrypto/hooks/useGetRefValue'
import { CryptoFormView, ProviderQuote } from 'views/BuyCrypto/types'
import styled from 'styled-components'
import { useTranslation } from '@pancakeswap/localization'
import { isMobile } from 'react-device-detect'
import formatLocaleNumber from 'utils/formatLocaleNumber'
import { providerFeeTypes } from 'views/BuyCrypto/constants'
import Image from 'next/image'
import { useBuyCryptoState } from 'state/buyCrypto/hooks'
import getTimePeriods from '@pancakeswap/utils/getTimePeriods'
import OnRampProviderLogo from '../OnRampProviderLogo/OnRampProviderLogo'
import pocketWatch from '../../../../../public/images/pocket-watch.svg'

const DropdownWrapper = styled.div<{ isClicked: boolean }>`
  display: ${({ isClicked }) => (isClicked ? 'none' : 'block')};
  width: 100%;
  transition: display 0.6s ease-in-out;
`

const FeeItem = ({ feeTitle, feeAmount, currency }: { feeTitle: string; feeAmount: number; currency: string }) => {
  const {
    currentLanguage: { locale },
  } = useTranslation()
  return (
    <RowBetween>
      <Text fontSize="14px" color="textSubtle">
        {feeTitle}
      </Text>
      <Text ml="4px" fontSize="14px" color="textSubtle">
        {formatLocaleNumber({ number: feeAmount, locale })} {currency}
      </Text>
    </RowBetween>
  )
}

const MOONPAY_CAMPAIGN_END_TIME = 1693465200

function AccordionItem({
  active,
  btnOnClick,
  quote,
  fetching,
  setModalView,
}: {
  active: boolean
  btnOnClick: any
  quote: ProviderQuote
  fetching: boolean
  setModalView: Dispatch<SetStateAction<CryptoFormView>>
}) {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const contentRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(active ? 240 : 90)
  const multiple = false
  const [visibility, setVisibility] = useState(false)
  const [mobileTooltipShow, setMobileTooltipShow] = useState(false)
  const { isNewCustomer } = useBuyCryptoState()

  const isActive = () => (multiple ? visibility : active)
  const isCampaignEligible = useMemo(
    () => isNewCustomer && quote.provider === 'MoonPay' && Date.now() / 1000 < MOONPAY_CAMPAIGN_END_TIME,
    [isNewCustomer, quote.provider],
  )
  const campaignTimeLeft = useMemo(
    () => (isCampaignEligible && quote ? getTimePeriods(MOONPAY_CAMPAIGN_END_TIME - Date.now() / 1000) : undefined),
    [isCampaignEligible, quote],
  )
  const isCampaignLastHour = useMemo(
    () => campaignTimeLeft && campaignTimeLeft.days === 0 && campaignTimeLeft.hours === 0,
    [campaignTimeLeft],
  )

  const toggleVisibility = useCallback(() => {
    setVisibility((v) => !v)
    btnOnClick()
  }, [setVisibility, btnOnClick])

  useEffect(() => {
    const contentEl = getRefValue(contentRef)
    setHeight(contentEl?.scrollHeight + 90)
  }, [active])

  const {
    tooltip: buyCryptoTooltip,
    tooltipVisible: buyCryptoTooltipVisible,
    targetRef: buyCryptoTargetRef,
  } = useTooltip(
    <Box maxWidth="150px">
      <Text as="p">
        {t('Price quote from provider is currently unavailable. Please try again or try a different amount')}
      </Text>
    </Box>,
    {
      placement: isMobile ? 'top' : 'bottom',
      trigger: isMobile ? 'focus' : 'hover',
      ...(isMobile && { manualVisible: mobileTooltipShow }),
    },
  )

  const providerFee = quote.providerFee < 3.5 && quote.provider === 'MoonPay' ? 3.5 : quote.providerFee

  if (quote.amount === 0) {
    return (
      <Flex flexDirection="column">
        <CryptoCard padding="16px 16px" style={{ height: '48px' }} position="relative" isClicked={false} isDisabled>
          <RowBetween paddingBottom="20px">
            <OnRampProviderLogo provider={quote.provider} />
            <TooltipText
              ref={buyCryptoTargetRef}
              onClick={() => setMobileTooltipShow(false)}
              display="flex"
              style={{ justifyContent: 'center', alignItems: 'center' }}
            >
              <Flex alignItems="center" justifyContent="center">
                <Text ml="4px" fontSize="14px" color="textSubtle">
                  {t('Quote not available')}
                </Text>
                <InfoIcon color="textSubtle" pl="4px" pt="2px" />
              </Flex>
            </TooltipText>
            {buyCryptoTooltipVisible && (!isMobile || mobileTooltipShow) && buyCryptoTooltip}
          </RowBetween>
        </CryptoCard>
      </Flex>
    )
  }
  return (
    <Flex flexDirection="column">
      <CryptoCard
        padding="16px 16px"
        style={{ height }}
        onClick={!isActive() ? toggleVisibility : () => null}
        position="relative"
        isClicked={active}
        isDisabled={false}
      >
        <RowBetween>
          <OnRampProviderLogo provider={quote.provider} />

          <Text ml="4px" fontSize="18px" color="#7A6EAA" fontWeight="bold">
            {formatLocaleNumber({
              number: isCampaignEligible && quote.provider === 'MoonPay' ? quote.noFee : quote.quote,
              locale,
            })}{' '}
            {quote.cryptoCurrency}
          </Text>
        </RowBetween>
        <RowBetween pt="12px">
          <Text fontSize="15px">
            {quote.cryptoCurrency} {t('rate')}
          </Text>
          <Text ml="4px" fontSize="16px">
            = {formatLocaleNumber({ number: Number(quote.price), locale })}{' '}
            {providerFee === 3.5 ? 'USD' : quote.fiatCurrency}
          </Text>
        </RowBetween>

        <DropdownWrapper ref={contentRef} isClicked={!isActive()}>
          {providerFeeTypes[quote.provider].map((feeType: string, index: number) => {
            let fee = 0
            if (index === 0) fee = quote.networkFee + (isCampaignEligible ? 0 : providerFee)
            else if (index === 1) fee = quote.networkFee
            else fee = isCampaignEligible ? 0 : providerFee
            return <FeeItem key={feeType} feeTitle={feeType} feeAmount={fee} currency={quote.fiatCurrency} />
          })}
          {isCampaignEligible ? (
            <Box mt="16px" background="#F0E4E2" padding="16px" border="1px solid #D67E0A" borderRadius="16px">
              <Flex>
                <Image src={pocketWatch} alt="pocket-watch" height={30} width={30} />
                <Text marginLeft="14px" fontSize="15px" color="#D67E0B">
                  {t('No provider fees.')}{' '}
                  {isCampaignLastHour
                    ? t('Ends in %minutes% minutes.', {
                        minutes: campaignTimeLeft?.minutes,
                      })
                    : t('Ends in %days% days and %hours% hours.', {
                        days: campaignTimeLeft?.days,
                        hours: campaignTimeLeft?.hours,
                      })}
                </Text>
              </Flex>
            </Box>
          ) : null}
          <FiatOnRampModalButton
            provider={quote.provider}
            inputCurrency={quote.cryptoCurrency}
            outputCurrency={quote.fiatCurrency}
            amount={quote.amount.toString()}
            disabled={fetching}
            setModalView={setModalView}
          />
        </DropdownWrapper>
      </CryptoCard>
    </Flex>
  )
}

export default AccordionItem
