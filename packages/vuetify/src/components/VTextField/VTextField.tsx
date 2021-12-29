// Styles
import './VTextField.sass'

// Components
import { filterInputProps, makeVInputProps, VInput } from '@/components/VInput/VInput'
import { filterFieldProps, makeVFieldProps, VField } from '@/components/VField/VField'
import { VCounter } from '@/components/VCounter'

// Composables
import { useProxiedModel } from '@/composables/proxiedModel'
import { useTextField } from './useTextField'

// Directives
import Intersect from '@/directives/intersect'

// Utilities
import { computed, ref } from 'vue'
import { defineComponent, filterInputAttrs, useRender } from '@/util'

// Types
import type { PropType } from 'vue'
import { useForwardRef } from '@/composables/forwardRef'

const dirtyTypes = ['color', 'file', 'time', 'date', 'datetime-local', 'week', 'month']

export const VTextField = defineComponent({
  name: 'VTextField',

  directives: { Intersect },

  inheritAttrs: false,

  props: {
    autofocus: Boolean,
    counter: [Boolean, Number, String] as PropType<true | number | string>,
    counterValue: Function as PropType<(value: any) => number>,
    prefix: String,
    placeholder: String,
    persistentPlaceholder: Boolean,
    persistentCounter: Boolean,
    suffix: String,
    type: {
      type: String,
      default: 'text',
    },

    ...makeVInputProps(),
    ...makeVFieldProps(),
  },

  emits: {
    'update:modelValue': (val: string) => true,
  },

  setup (props, { attrs, slots }) {
    const model = useProxiedModel(props, 'modelValue')

    const internalDirty = ref(false)
    const isDirty = computed(() => {
      return internalDirty.value || !!model.value || dirtyTypes.includes(props.type)
    })

    const counterValue = computed(() => {
      return typeof props.counterValue === 'function'
        ? props.counterValue(model.value)
        : (model.value || '').toString().length
    })
    const max = computed(() => {
      if (attrs.maxlength) return attrs.maxlength as undefined

      if (
        !props.counter ||
        (typeof props.counter !== 'number' &&
        typeof props.counter !== 'string')
      ) return undefined

      return props.counter
    })

    const {
      isFocused,
      inputRef,
      vInputRef,
      vFieldRef,
      focus,
      blur,
      getInputProps,
      intersectOptions,
    } = useTextField(props)

    useRender(() => {
      const hasCounter = !!(slots.counter || props.counter || props.counterValue)
      const [rootAttrs, inputAttrs] = filterInputAttrs(attrs)
      const [inputProps] = filterInputProps(props)
      const [fieldProps] = filterFieldProps(props)

      return (
        <VInput
          ref={ vInputRef }
          class={[
            'v-text-field',
            {
              'v-text-field--prefixed': props.prefix,
              'v-text-field--suffixed': props.suffix,
            },
          ]}
          focused={ isFocused.value }
          { ...rootAttrs }
          { ...inputProps }
        >
          {{
            ...slots,
            default: ({ isDisabled, isReadonly }) => (
              <VField
                ref={ vFieldRef }
                active={ isDirty.value }
                onUpdate:active={ val => internalDirty.value = val }
                onClick:control={ focus }
                onClick:clear={ e => {
                  e.stopPropagation()

                  model.value = ''
                }}
                role="textbox"
                { ...fieldProps }
              >
                {{
                  ...slots,
                  default: ({ isActive, props: slotProps }) => {
                    const showPlaceholder = isActive || props.persistentPlaceholder

                    return (
                      <>
                        { props.prefix && (
                          <span class="v-text-field__prefix" style={{ opacity: showPlaceholder ? undefined : '0' }}>
                            { props.prefix }
                          </span>
                        ) }

                        <input
                          style={{ opacity: showPlaceholder ? undefined : '0' }} // can't this just be a class?
                          v-model={ model.value }
                          v-intersect={ intersectOptions }
                          readonly={ isReadonly.value }
                          disabled={ isDisabled.value }
                          type={ props.type }
                          { ...getInputProps() }
                          { ...slotProps }
                          { ...inputAttrs }
                        />

                        { props.suffix && (
                          <span class="v-text-field__suffix" style={{ opacity: showPlaceholder ? undefined : '0' }}>
                            { props.suffix }
                          </span>
                        ) }
                      </>
                    )
                  },
                }}
              </VField>
            ),
            details: hasCounter ? ({ isFocused }) => (
              <>
                <span />

                <VCounter
                  active={ props.persistentCounter || isFocused.value }
                  value={ counterValue.value }
                  max={ max.value }
                  v-slots={ slots.counter }
                />
              </>
            ) : undefined,
          }}
        </VInput>
      )
    })

    return useForwardRef({
      focus,
      blur,
    }, vInputRef, vFieldRef, inputRef)
  },
})

export type VTextField = InstanceType<typeof VTextField>