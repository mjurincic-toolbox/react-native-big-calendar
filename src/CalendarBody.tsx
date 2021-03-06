import dayjs from 'dayjs'
import * as React from 'react'
import {
  GestureResponderHandlers,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { CalendarEvent } from './CalendarEvent'
import { commonStyles } from './commonStyles'
import { DayJSConvertedEvent, Event, EventCellStyle } from './interfaces'
import { formatHour, getRelativeTopInDay, hours, isToday } from './utils'

interface CalendarBodyProps<T> {
  containerHeight: number
  cellHeight: number
  dateRange: dayjs.Dayjs[]
  dayJsConvertedEvents: DayJSConvertedEvent[]
  style: ViewStyle
  onPressEvent?: (event: Event<T>) => void
  eventCellStyle?: EventCellStyle<T>
  scrollOffsetMinutes: number
  showTime: boolean
  panHandlers?: GestureResponderHandlers
}

const HourGuideColumn = React.memo(
  ({ cellHeight, hour }: { cellHeight: number; hour: number }) => (
    <View style={{ height: cellHeight }}>
      <Text style={commonStyles.guideText}>{formatHour(hour)}</Text>
    </View>
  ),
  () => true,
)

const HourCell = React.memo(
  ({ cellHeight }: { cellHeight: number }) => (
    <View style={[commonStyles.dateCell, { height: cellHeight }]} />
  ),
  () => true,
)

export const CalendarBody = React.memo(
  ({
    containerHeight,
    cellHeight,
    dateRange,
    style = {},
    panHandlers = {},
    dayJsConvertedEvents,
    onPressEvent,
    eventCellStyle,
    showTime,
    scrollOffsetMinutes,
  }: CalendarBodyProps<any>) => {
    const scrollView = React.useRef<ScrollView>(null)
    const [now, setNow] = React.useState(dayjs())

    React.useEffect(() => {
      if (scrollView.current && scrollOffsetMinutes) {
        // We add delay here to work correct on React Native
        // see: https://stackoverflow.com/questions/33208477/react-native-android-scrollview-scrollto-not-working
        setTimeout(
          () => {
            scrollView.current!.scrollTo({
              y: (cellHeight * scrollOffsetMinutes) / 60,
              animated: false,
            })
          },
          Platform.OS === 'web' ? 0 : 10,
        )
      }
    }, [scrollView.current])

    React.useEffect(() => {
      const pid = setInterval(() => setNow(dayjs()), 2 * 60 * 1000)
      return () => clearInterval(pid)
    }, [])

    return (
      <ScrollView
        style={[{ height: containerHeight - cellHeight * 3 }, style]}
        ref={scrollView}
        {...(Platform.OS !== 'web' ? panHandlers : {})}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.body]} {...(Platform.OS === 'web' ? panHandlers : {})}>
          <View style={[commonStyles.hourGuide]}>
            {hours.map(hour => (
              <HourGuideColumn key={hour} cellHeight={cellHeight} hour={hour} />
            ))}
          </View>
          {dateRange.map(date => (
            <View style={[{ flex: 1 }]} key={date.toString()}>
              {hours.map(hour => (
                <HourCell key={hour} cellHeight={cellHeight} />
              ))}
              {dayJsConvertedEvents
                .filter(
                  ({ start, end }) =>
                    start.isAfter(date.startOf('day')) && end.isBefore(date.endOf('day')),
                )
                .map(event => (
                  <CalendarEvent
                    key={event.start.toString()}
                    event={event}
                    onPressEvent={onPressEvent}
                    eventCellStyle={eventCellStyle}
                    showTime={showTime}
                  />
                ))}
              {isToday(date) && (
                <View style={[styles.nowIndicator, { top: `${getRelativeTopInDay(now)}%` }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    )
  },
)

const styles = StyleSheet.create({
  body: {
    flexDirection: 'row',
    flex: 1,
  },
  nowIndicator: {
    position: 'absolute',
    zIndex: 10000,
    backgroundColor: 'red',
    height: 2,
    width: '100%',
  },
})
