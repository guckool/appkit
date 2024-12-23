import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  closestCenter,
  CollisionDetection,
  DragOverlay,
  DndContext,
  DropAnimation,
  KeyboardSensor,
  KeyboardCoordinateGetter,
  Modifiers,
  MouseSensor,
  MeasuringConfiguration,
  PointerActivationConstraint,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  SortingStrategy,
  AnimateLayoutChanges,
  NewIndexGetter,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'

const defaultInitializer = (index: number) => index

export function createRange<T = number>(
  length: number,
  initializer: (index: number) => any = defaultInitializer
): T[] {
  return [...new Array(length)].map((_, index) => initializer(index))
}

import { ConnectMethodItem } from './connect-method-item'
import { SortableConnectMethodItem } from '@/components/sortable-item-connect-method'
import { Wrapper } from '@/components/ui/wrapper'
import { List } from '@/components/ui/list'

export interface Props {
  activationConstraint?: PointerActivationConstraint
  animateLayoutChanges?: AnimateLayoutChanges
  adjustScale?: boolean
  collisionDetection?: CollisionDetection
  coordinateGetter?: KeyboardCoordinateGetter
  Container?: any // To-do: Fix me
  dropAnimation?: DropAnimation | null
  getNewIndex?: NewIndexGetter
  handle?: boolean
  items?: UniqueIdentifier[]
  measuring?: MeasuringConfiguration
  modifiers?: Modifiers
  renderItem?: any
  removable?: boolean
  reorderItems?: typeof arrayMove
  strategy?: SortingStrategy
  style?: React.CSSProperties
  useDragOverlay?: boolean
  getItemStyles?(args: {
    id: UniqueIdentifier
    index: number
    isSorting: boolean
    isDragOverlay: boolean
    overIndex: number
    isDragging: boolean
  }): React.CSSProperties
  onToggleOption?(name: 'Email' | 'Socials' | 'Wallets'): void
  handleNewOrder?(items: UniqueIdentifier[]): void
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5'
      }
    }
  })
}

export function SortableConnectMethodList({
  activationConstraint,
  animateLayoutChanges,
  adjustScale = false,
  Container = List,
  collisionDetection = closestCenter,
  coordinateGetter = sortableKeyboardCoordinates,
  dropAnimation = dropAnimationConfig,
  getItemStyles = () => ({}),
  getNewIndex,
  handle = false,
  items: initialItems,
  measuring,
  modifiers,
  renderItem,
  reorderItems = arrayMove,
  style,
  useDragOverlay = true,
  onToggleOption,
  handleNewOrder
}: Props) {
  const [items, setItems] = useState<UniqueIdentifier[]>(() => initialItems ?? [])
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint
    }),
    useSensor(TouchSensor, {
      activationConstraint
    }),
    useSensor(KeyboardSensor, {
      scrollBehavior: 'auto',
      coordinateGetter
    })
  )
  const isFirstAnnouncement = useRef(true)
  const getIndex = (id: UniqueIdentifier) => items.indexOf(id)
  const activeIndex = activeId != null ? getIndex(activeId) : -1

  useEffect(() => {
    if (activeId == null) {
      isFirstAnnouncement.current = true
    }
  }, [activeId])

  const orderString = useMemo(() => items.join(','), [items])
  const orderFromPropsString = useMemo(() => initialItems?.join(','), [initialItems])

  useEffect(() => {
    if (handleNewOrder && orderString) {
      handleNewOrder(orderString.split(','))
    }
  }, [orderString])

  useEffect(() => {
    setItems(orderFromPropsString ? orderFromPropsString.split(',') : [])
  }, [orderFromPropsString])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={({ active }) => {
        if (!active) {
          return
        }

        setActiveId(active.id)
      }}
      onDragEnd={({ over }) => {
        setActiveId(null)

        if (over) {
          const overIndex = getIndex(over.id)
          if (activeIndex !== overIndex) {
            setItems(items => reorderItems(items, activeIndex, overIndex))
          }
        }
      }}
      onDragCancel={() => setActiveId(null)}
      measuring={measuring}
      modifiers={modifiers}
    >
      <Wrapper style={style} center>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <Container>
            {items.map((value, index) => (
              <SortableConnectMethodItem
                key={value}
                id={value}
                handle={handle}
                index={index}
                style={getItemStyles}
                renderItem={renderItem}
                animateLayoutChanges={animateLayoutChanges}
                useDragOverlay={useDragOverlay}
                getNewIndex={getNewIndex}
                onToggleOption={onToggleOption}
              />
            ))}
          </Container>
        </SortableContext>
      </Wrapper>
      {useDragOverlay
        ? createPortal(
            <DragOverlay adjustScale={adjustScale} dropAnimation={dropAnimation}>
              {activeId != null ? (
                <ConnectMethodItem
                  value={items[activeIndex]}
                  handle={handle}
                  renderItem={renderItem}
                  style={getItemStyles({
                    id: items[activeIndex],
                    index: activeIndex,
                    isSorting: activeId !== null,
                    isDragging: true,
                    overIndex: -1,
                    isDragOverlay: true
                  })}
                  dragOverlay
                />
              ) : null}
            </DragOverlay>,
            document.body
          )
        : null}
    </DndContext>
  )
}