import React from 'react';

export const DMToolsDictionary = ({ expandedNotes, toggleDictionarySection }) => {
    return (
        <div className="p-4">
            {/* Dictionary View */}
            <h2 className="text-xl font-bold mb-4">Nimble Dictionary</h2>

            <div className="text-xs text-text-muted mb-4 italic">
                Reference for rules and conditions during gameplay.
            </div>

            {/* VTT Features Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('vttFeatures')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">VTT Features</span>
                    <span className="text-text-muted">{expandedNotes['vttFeatures'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['vttFeatures'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Complete guide to all features available in Nimble VTT for managing combat encounters.
                        </div>

                        {/* Combat Management */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-blue-400 mb-2">Combat Management</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Turn & Action Tracking</div>
                                    <div className="text-xs text-gray-300">Track turn order, and actions for heros, companions, enemies, and legendary monsters. Reset non-hero actions using the reset button in the top right of the turn order.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Quick Combat Controls</div>
                                    <div className="text-xs text-gray-300">Start combat, track turns, and track health & conditions quickly using the info button on each token in the turn order. </div>
                                </div>
                            </div>
                        </div>

                        {/* Token Management */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Token Management</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">Add Combatants</div>
                                    <div className="text-xs text-gray-300">Create heroes, companions, enemies, or legendary creatures with a custom name and picture. Set their HP in the turn order.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">HP Management</div>
                                    <div className="text-xs text-gray-300">Apply damage or healing with quick buttons. Visual HP bars show current health status. [COMING SOON]Automatically tracks bloodied (half HP) states.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Wounds & Death</div>
                                    <div className="text-xs text-gray-300">[COMING SOON]Track wound counters for heroes. Automatically marks tokens as dying at 0 HP. Visual indicators for wounded and dying states.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Token Types</div>
                                    <div className="text-xs text-gray-300">Color-coded token types: Heroes (blue), Companions (green), Enemies (red), Legendary (purple) for easy identification.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Delete & Remove</div>
                                    <div className="text-xs text-gray-300">Remove individual tokens from combat with the trash icon.</div>
                                </div>
                            </div>
                        </div>

                        {/* Notes & Tracking */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-purple-400 mb-2">Notes & Tracking</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Per-Token Notes</div>
                                    <div className="text-xs text-gray-300">Click any token to access its notes panel. Track exttra resources, special abilities, or any other important information.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Condition Reference</div>
                                    <div className="text-xs text-gray-300">Quick access to all Nimble RPG conditions within the info section of a token. Organized by severity: Doomed, Major, and Minor conditions.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Persistent Storage</div>
                                    <div className="text-xs text-gray-300">[COMING SOON] All combat data automatically saves to your browser. Your encounter persists between sessions until you reset it.</div>
                                </div>
                            </div>
                        </div>

                        {/* File Management */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-yellow-400 mb-2">File Management</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Save Battles</div>
                                    <div className="text-xs text-gray-300">Export your current encounter as a JSON file. Saves all tokens, HP, actions, notes, and combat state.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Load Battles</div>
                                    <div className="text-xs text-gray-300">Import previously saved encounters. Perfect for recurring enemies, pre-planned battles, or portable games.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Battle Templates</div>
                                    <div className="text-xs text-gray-300">[COMING SOON] Create reusable encounter templates with pre-configured enemies, HP, and initiatives for quick combat setup.</div>
                                </div>
                            </div>
                        </div>

                        {/* Interface Features */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-cyan-400 mb-2">Interface Features</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Sidebar Toggle</div>
                                    <div className="text-xs text-gray-300">Switch between Turn Order and Dictionary views using the tabs at the top of the sidebar.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Visual Indicators</div>
                                    <div className="text-xs text-gray-300">Condition indicators and token highlighting for quick status recognition.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Add Background</div>
                                    <div className="text-xs text-gray-300">Quickly upload and use different battlemaps for your games.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Responsive Design</div>
                                    <div className="text-xs text-gray-300">Clean, dark-themed interface optimized for readability during game sessions.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Drawing</div>
                                    <div className="text-xs text-gray-300">Simple drawing and erasing mechanics to add to levels or point things out.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Keyboard Shortcuts</div>
                                    <div className="text-xs text-gray-300"> SHIFT on a token to quickly read conditions and notes. CTRL + Z and CTRL + SHIFT + Z to undo and redo drawings.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Conditions Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('conditions')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Conditions</span>
                    <span className="text-text-muted">{expandedNotes['conditions'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['conditions'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Some attacks, traps, spells, or other effects can inflict conditions—usually negative effects other than damage. Some conditions are temporary, lasting as little as a single round; others may last until cured in some way, and some can be ended by using an action to make an appropriate save.
                        </div>

                        {/* Doomed Conditions */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-red-400 mb-2">Doomed Conditions</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-red-300">Bloodied</div>
                                    <div className="text-xs text-gray-300">At half HP or less.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Dying</div>
                                    <div className="text-xs text-gray-300">At 0 HP. Taking damage while dying causes 2 Wounds, a crit causes 3 instead.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Wounded</div>
                                    <div className="text-xs text-gray-300">Has any Wounds (typically 6 Wounds and a hero is dead).</div>
                                </div>
                            </div>
                        </div>

                        {/* Major Conditions */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-orange-400 mb-2">Major Conditions</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Blinded</div>
                                    <div className="text-xs text-gray-300">Can't see. Attacks against you have advantage, and your attacks have disadvantage.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Invisible</div>
                                    <div className="text-xs text-gray-300">Cannot be seen. Your attacks have advantage, and attacks against you have disadvantage.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Dazed</div>
                                    <div className="text-xs text-gray-300">Heroes: lose 1 action; monsters: can perform one less action on their next turn.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Charmed</div>
                                    <div className="text-xs text-gray-300">Sees the charmer as an ally. Charmer has advantage on social interactions with you.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Taunted</div>
                                    <div className="text-xs text-gray-300">Disadvantage on attacks except against the most recent taunter.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Frightened</div>
                                    <div className="text-xs text-gray-300">Disadvantage on rolls when source of fear is nearby; speed halved when moving closer to it.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Grappled</div>
                                    <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Riding</div>
                                    <div className="text-xs text-gray-300">You move with the creature you are riding. Any attacks that miss you, strike them.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Petrified</div>
                                    <div className="text-xs text-gray-300">Incapacitated. You have all the benefits and drawbacks of being a rock! Immune to most damage except from large explosions, picks, or similar tools.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Restrained</div>
                                    <div className="text-xs text-gray-300">Cannot move. Attacks against you have advantage.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Incapacitated</div>
                                    <div className="text-xs text-gray-300">Can't do anything. Attacks against you have advantage, and melee attacks that hit, crit.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Poisoned</div>
                                    <div className="text-xs text-gray-300">Disadvantage on rolls.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Slowed</div>
                                    <div className="text-xs text-gray-300">Speed halved during your next turn.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Prone</div>
                                    <div className="text-xs text-gray-300">Movement costs twice as much, and disadvantage on attacks. Melee attacks against you have advantage; Ranged have disadvantage. Spend 3 spaces of your Speed to stand up.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Hampered</div>
                                    <div className="text-xs text-gray-300">Any creature with their actions or movement reduced (e.g., Dazed, Grappled, Prone, Difficult Terrain).</div>
                                </div>
                            </div>
                        </div>

                        {/* Minor Conditions */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-yellow-400 mb-2">Minor Conditions</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Smoldering</div>
                                    <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Charged</div>
                                    <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Distracted</div>
                                    <div className="text-xs text-gray-300">Minor status. Does nothing on its own and ends when combat does. Some spells and abilities have additional effects against such targets.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* VTT Features Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Skill Checks & Saves')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Skill Checks & Saves</span>
                    <span className="text-text-muted">{expandedNotes['Skill Checks & Saves'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Skill Checks & Saves'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            When you want to affect the world (convince an NPC, spot a trap, pick a lock, etc.), the GM may call for a skill check. Roll 1d20 and add your skill (the max bonus a skill can ever have is +12). If the total meets or exceeds the Difficulty Challenge (DC), you succeed; otherwise, you fail.
                        </div>

                        {/* Core Mechanics */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-blue-400 mb-2">Core Mechanics</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Critical Success & Failure</div>
                                    <div className="text-xs text-gray-300">A roll of 1 always fails regardless of any other bonuses, while a roll of 20 always succeeds.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Skill Check Formula</div>
                                    <div className="text-xs text-gray-300">Roll 1d20 + skill bonus (max +12). If total ≥ DC, you succeed.</div>
                                </div>
                            </div>
                        </div>

                        {/* Difficulty Challenges */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Difficulty Challenges (DC)</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">Easy (DC 8)</div>
                                    <div className="text-xs text-gray-300">Spotting a large Ogre crouched behind a small bush might be a DC 8 Perception check.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Medium (DC 12)</div>
                                    <div className="text-xs text-gray-300">A hidden doorway behind a bookcase might be a DC 12 Examination check.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Challenging (DC 15)</div>
                                    <div className="text-xs text-gray-300">Calming an injured Owlbear stuck in a trap may be a DC 15 Naturecraft check.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Very Difficult (DC 18)</div>
                                    <div className="text-xs text-gray-300">Intuiting the true intentions of a trained Spy may be a DC 18 Insight check.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Extremely Difficult (DC 20+)</div>
                                    <div className="text-xs text-gray-300">Disarming an ancient legendary trap may be a DC 20+ Finesse check.</div>
                                </div>
                            </div>
                        </div>

                        {/* Saves */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-purple-400 mb-2">Saves</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-purple-300">What Are Saves?</div>
                                    <div className="text-xs text-gray-300">When the world affects you, roll a save instead of a skill check. Roll 1d20 and add the relevant stat. A roll of 1 always fails, 20 always saves. You can choose to fail any save instead of rolling.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">STR Save</div>
                                    <div className="text-xs text-gray-300">When your overall fitness and physicality is tested. STR helps resist forced movement, restraint, poison, and extreme temperatures.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">DEX Save</div>
                                    <div className="text-xs text-gray-300">When your agility or speed is tested. DEX helps you dive for cover in an explosion or stay on your feet while running across icy terrain.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">INT Save</div>
                                    <div className="text-xs text-gray-300">When your intelligence is tested. INT helps you see through tricks and illusions.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">WIL Save</div>
                                    <div className="text-xs text-gray-300">When your courage or personality is tested. WIL helps you resist charm or fear effects.</div>
                                </div>
                            </div>
                        </div>

                        {/* Heroes and Saves */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-yellow-400 mb-2">Heroes and Saves</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Effect DC</div>
                                    <div className="text-xs text-gray-300">Unless otherwise noted, the DC for effects a hero causes is 10+KEY.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Save Modifiers</div>
                                    <div className="text-xs text-gray-300">Each hero has 1 advantaged save (+), 1 disadvantaged save (–), and 2 neutral saves.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Example</div>
                                    <div className="text-xs text-gray-300">A Berserker (STR+, INT–) would roll all of his STR saves with advantage and all of his INT saves with disadvantage.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Size Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Size')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Size</span>
                    <span className="text-text-muted">{expandedNotes['Size'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Size'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Some spells and abilities affect differently sized objects or creatures. Use the following guidelines for size:
                        </div>

                        {/* Size Categories */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-blue-400 mb-2">Size Categories</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Tiny</div>
                                    <div className="text-xs text-gray-300">Can be carried in a typical pocket (many can comfortably fit in 1 space).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Small</div>
                                    <div className="text-xs text-gray-300">Can be carried in a backpack (2 can comfortably fit in 1 space).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Medium</div>
                                    <div className="text-xs text-gray-300">The average human size (1 can comfortably fit in 1 space).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Large</div>
                                    <div className="text-xs text-gray-300">Roughly the size of a bear (1 can comfortably fit in a 2x2 area).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Huge</div>
                                    <div className="text-xs text-gray-300">Roughly the size of a small house (1 can comfortably fit in a 3x3 area).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Gargantuan</div>
                                    <div className="text-xs text-gray-300">Can be as large as a castle keep (1 can fill a 4x4 area or greater).</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Hit Points & Dying Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Hit Points & Dying')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Hit Points & Dying</span>
                    <span className="text-text-muted">{expandedNotes['Hit Points & Dying'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Hit Points & Dying'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Hit Points (HP) represent your ability to endure damage. Damage reduces your HP (which can't go below 0). When reduced to 0 HP, gain 1 Wound; you also gain the Dying condition until you regain HP.
                        </div>

                        {/* Dying Condition */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-red-400 mb-2">Dying Condition</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-red-300">While Dying</div>
                                    <div className="text-xs text-gray-300">Actions are limited to 1, Concentration is broken, and you are at risk of further serious harm.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Attacking/Casting While Dying</div>
                                    <div className="text-xs text-gray-300">Causes 1 Wound unless you make a DC 10 STR save.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Taking Damage While Dying</div>
                                    <div className="text-xs text-gray-300">Causes 2 Wounds; a critical hit causes 3 instead.</div>
                                </div>
                            </div>
                        </div>

                        {/* Wounds */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-orange-400 mb-2">Wounds</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-orange-300">What Are Wounds?</div>
                                    <div className="text-xs text-gray-300">Wounds are serious injuries you've taken; they are a long term gauge of how close you are to death. HP can usually be recovered quickly, but Wounds may take many days of resting to fully recover from (usually 1/Safe Rest).</div>
                                </div>
                            </div>
                        </div>

                        {/* Death */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-purple-400 mb-2">Death</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Death at 6 Wounds</div>
                                    <div className="text-xs text-gray-300">You die when you have taken 6 Wounds (unless you have an ability that changes this number). There are ways to revive a hero who has died, but they are rare and often come at a very steep cost.</div>
                                </div>
                            </div>
                        </div>

                        {/* Temporary HP */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-cyan-400 mb-2">Temporary HP</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">How Temp HP Works</div>
                                    <div className="text-xs text-gray-300">Some abilities or effects may grant temporary HP (temp HP); these are reduced first when taking damage. Temp HP do not combine: If a hero has temp HP and would gain more, they instead choose which amount to keep. They expire after a Safe Rest.</div>
                                </div>
                            </div>
                        </div>

                        {/* Hit Dice */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Hit Dice</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">What Are Hit Dice?</div>
                                    <div className="text-xs text-gray-300">Hit Dice (HD) represent your ability to quickly recuperate from minor injuries and are spent to regain HP. Heroes start with a max of 1 Hit Die at level 1, and this limit increases by 1 each time they level up.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Recovery</div>
                                    <div className="text-xs text-gray-300">Hit Dice are recovered during a Safe Rest.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Speed & Range Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Speed & Range')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Speed & Range</span>
                    <span className="text-text-muted">{expandedNotes['Speed & Range'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Speed & Range'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            A character's Speed is how fast they can move, which, unless otherwise noted, is 6. Often play is done on a grid with 1 inch squares or hexagons representing roughly 5 ft. or 1 meter each.
                        </div>

                        {/* Movement */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-blue-400 mb-2">Movement</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Standard Speed</div>
                                    <div className="text-xs text-gray-300">A hero with a speed of 6 can travel up to 6 spaces horizontally or diagonally.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Moving Through Spaces</div>
                                    <div className="text-xs text-gray-300">You can move through spaces occupied by allies (or enemies as difficult terrain: half speed), as long as you don't end movement in an occupied space.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Alternate Options</div>
                                    <div className="text-xs text-gray-300">For a quicker, more loose game, you can forego counting spaces and measure typical movement roughly from pinkie to thumb. Slightly less for players with large hands (or slower characters), a bit more for our tiny-handed friends (or faster characters).</div>
                                </div>
                            </div>
                        </div>

                        {/* Range & Reach */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Range & Reach</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">Default Reach</div>
                                    <div className="text-xs text-gray-300">Certain abilities, weapons, and spells have a specified Range or Reach, which determines how far away your target can be affected. If none is specified, default to Reach 1.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">In Melee</div>
                                    <div className="text-xs text-gray-300">If any enemy is adjacent to you, your Ranged attacks are made with disadvantage (Reach attacks are not so affected).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Long Range</div>
                                    <div className="text-xs text-gray-300">You can gain disadvantage 1 to gain +2 Range on any Ranged attack (max +6).</div>
                                </div>
                            </div>
                        </div>

                        {/* Falling & Forced Movement */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-red-400 mb-2">Falling & Forced Movement</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-red-300">Forced Movement Damage</div>
                                    <div className="text-xs text-gray-300">When a character is forcibly moved but stopped by an obstacle, they take 1d6 bludgeoning damage for every space this movement is shortened. If they hit another creature, both creatures split this damage.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Falling Damage</div>
                                    <div className="text-xs text-gray-300">Falling inflicts 1d6 bludgeoning damage for every 10 ft. fallen (2 spaces).</div>
                                </div>
                            </div>
                        </div>

                        {/* Abstracted Distances */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-purple-400 mb-2">Abstracted Distances</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Close, Midrange, and Far</div>
                                    <div className="text-xs text-gray-300">If preferred, you can use a more abstracted system of distance. Use Close, Midrange, and Far. A move from Midrange can traverse to Close or Far.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Distance Rules</div>
                                    <div className="text-xs text-gray-300">Close creatures can be affected Reach/Range 4; Midrange, up to 6; beyond that is Far. As always, the GM will adjudicate unclear situations and which creatures are affected by abilities with an area of effect.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Concentration Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Concentration')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Concentration</span>
                    <span className="text-text-muted">{expandedNotes['Concentration'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Concentration'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Some activities require Concentration to maintain. A character can only concentrate on one activity at a time.
                        </div>

                        {/* Concentration Rules */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-yellow-400 mb-2">Concentration Rules</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Breaking Concentration (Critical Hit)</div>
                                    <div className="text-xs text-gray-300">Whenever a character is crit while concentrating, they must make a DC 10 STR save. Failing this means Concentration is broken and the activity fails.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Automatic Break</div>
                                    <div className="text-xs text-gray-300">Concentration is automatically broken whenever a character drops to 0 HP or is incapacitated.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cover & Hiding Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Cover & Hiding')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Cover & Hiding</span>
                    <span className="text-text-muted">{expandedNotes['Cover & Hiding'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Cover & Hiding'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Cover provides protection from attacks by obscuring line of sight.
                        </div>

                        {/* Cover */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-cyan-400 mb-2">Cover</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Cover</div>
                                    <div className="text-xs text-gray-300">A creature mostly obscured from line of sight (standing behind a tree, a larger ally, a knocked over table, in poor lighting, etc.) has Cover and imposes disadvantage on attacks against them.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-cyan-300">Full Cover</div>
                                    <div className="text-xs text-gray-300">A creature completely obscured from view has Full Cover and cannot typically be targeted by an attack.</div>
                                </div>
                            </div>
                        </div>

                        {/* Hiding */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Hiding</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">How to Hide</div>
                                    <div className="text-xs text-gray-300">To hide in combat, you must have Cover from the creatures you are attempting to hide from and use an action to make a DC 15 Stealth check (if you have Full Cover, you succeed automatically).</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Hidden Attack</div>
                                    <div className="text-xs text-gray-300">The first attack you make while hidden is made with advantage, then you are no longer hidden. If this attack kills the enemy and no other enemy can see you, you may remain hidden instead.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">GM Reminder</div>
                                    <div className="text-xs text-gray-300">Monsters are smart! They may catch on to heroes using the same tactics over and over again!</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grappling Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Grappling')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Grappling</span>
                    <span className="text-text-muted">{expandedNotes['Grappling'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Grappling'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            You can attempt to grab another creature provided you are within Reach and have at least 1 arm free (or some other way to grab them).
                        </div>

                        {/* Grapple Effects */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-orange-400 mb-2">Grappling</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Initiating a Grapple</div>
                                    <div className="text-xs text-gray-300">On a failed STR or DEX save (DC 10+STR or DEX), the target is affected based on their size.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Target Your Size or Smaller</div>
                                    <div className="text-xs text-gray-300">The target is Grappled.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Target Larger Than You</div>
                                    <div className="text-xs text-gray-300">You gain the Riding condition.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-orange-300">Ending a Grapple</div>
                                    <div className="text-xs text-gray-300">Forced movement (pushing a grappler away), incapacitation, or spending an action and succeeding on a STR or DEX save can end it.</div>
                                </div>
                            </div>
                        </div>

                        {/* Restrained */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-red-400 mb-2">Restrained</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-red-300">What is Restrained?</div>
                                    <div className="text-xs text-gray-300">Functions like Grappled, but is caused by objects (e.g., chains, rope, roots) and ignores size restrictions.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-red-300">Ending Restrained</div>
                                    <div className="text-xs text-gray-300">It can be ended through any logical means, such as picking a lock or cutting/burning rope.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Resting & Downtime Section */}
            <div className="mb-4">
                <button
                    onClick={() => toggleDictionarySection('Resting & Downtime')}
                    className="w-full bg-surface-highlight hover:bg-button-muted px-3 py-2 rounded flex items-center justify-between text-left"
                >
                    <span className="font-bold">Resting & Downtime</span>
                    <span className="text-text-muted">{expandedNotes['Resting & Downtime'] ? '−' : '+'}</span>
                </button>

                {expandedNotes['Resting & Downtime'] && (
                    <div className="bg-surface-highlight p-3 rounded-b mt-1">
                        <div className="text-xs text-gray-300 mb-4">
                            Rest to recover from injuries and spend downtime on various activities to prepare for your next adventure.
                        </div>

                        {/* Field Rests */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-blue-400 mb-2">Field Rests</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Catch Breath</div>
                                    <div className="text-xs text-gray-300">Requires at least 10 minutes to tend to your injuries. Expend any number of Hit Dice one at a time (roll them and add your STR to each), and regain that many HP.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Make Camp</div>
                                    <div className="text-xs text-gray-300">If you rest for at least 8 hours with food and sleep, take the maximum value for each Hit Die you expend instead of rolling. Add your STR to each Hit Die as usual.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-300">Negative STR</div>
                                    <div className="text-xs text-gray-300">Your frail body doesn't recover as quickly as others. Subtract your STR from each HD you expend.</div>
                                </div>
                            </div>
                        </div>

                        {/* Safe Rests */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-green-400 mb-2">Safe Rests</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-green-300">Safe Rest Requirements</div>
                                    <div className="text-xs text-gray-300">Safe Rests take place in a safe location designated by your GM, typically lodging at an inn overnight—but could also be at a secret oasis, a well-stocked cabin in the woods, near a sacred shrine, or the like. Camping in the open wilderness or in a dungeon is not sufficient.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Safe Rest Benefits</div>
                                    <div className="text-xs text-gray-300">After a Safe Rest, heroes recover all of their HP, Hit Dice, mana (and other class-specific resources), and heal 1 Wound. Safe Rests are a great opportunity for downtime activities as well.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-green-300">Alternative: Extended Rest</div>
                                    <div className="text-xs text-gray-300">If your table prefers to largely skip downtime activities and narrate past a week of resting, that's okay too! For a more realistic convalescence time, 1 week per wound recovered may make more sense.</div>
                                </div>
                            </div>
                        </div>

                        {/* Lodging */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-yellow-400 mb-2">Lodging</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Lodging Quality</div>
                                    <div className="text-xs text-gray-300">The cheapest rooms at an inn save you money but may lead to complications. On the other hand, some inns may allow you to pay a premium for a nicer room and amenities, giving you a Temporary Boon.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Poor (5 sp/person/day)</div>
                                    <div className="text-xs text-gray-300">Basic, cheap accommodations. May lead to complications.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Comfortable (2 gp/person/day)</div>
                                    <div className="text-xs text-gray-300">Standard lodging with decent amenities.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-yellow-300">Lavish (10 gp/person/day)</div>
                                    <div className="text-xs text-gray-300">Luxurious accommodations. Allows players to gain one Temporary Boon the following day.</div>
                                </div>
                            </div>
                        </div>

                        {/* Downtime */}
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-purple-400 mb-2">Downtime Activities</h3>
                            <div className="space-y-2">
                                <div>
                                    <div className="text-xs font-bold text-purple-300">What is Downtime?</div>
                                    <div className="text-xs text-gray-300">The time you aren't out adventuring is called Downtime. You can spend Downtime to recuperate from your adventures and partake in Downtime Activities. Not every moment of Downtime needs to be narrated or roleplayed.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Retrain</div>
                                    <div className="text-xs text-gray-300">Spend time doing activities to retrain any of your chosen abilities, features, or if it makes sense in the story, possibly even your subclass.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Gather Information</div>
                                    <div className="text-xs text-gray-300">Meet NPCs, pick up news, or collect rumors and job leads.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Personal Goals</div>
                                    <div className="text-xs text-gray-300">Pursue goals from your backstory or other smaller quests you've chosen.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Buy & Sell</div>
                                    <div className="text-xs text-gray-300">Get new equipment, and sell treasures you've collected while out adventuring.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Perform</div>
                                    <div className="text-xs text-gray-300">Play music, tell stories, compete, or perform in public to earn gold or fame.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Craft</div>
                                    <div className="text-xs text-gray-300">Create weapons, armor, or simple items using materials you've acquired.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Socialize</div>
                                    <div className="text-xs text-gray-300">Build alliances, make new friends, or make new enemies.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Invest</div>
                                    <div className="text-xs text-gray-300">Use your gold to invest in businesses or trade ventures for future profit.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Mentor</div>
                                    <div className="text-xs text-gray-300">Teach a skill or ability to another character or NPC.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Research</div>
                                    <div className="text-xs text-gray-300">Investigate a mystery, study ancient texts, or uncover hidden knowledge.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Serve</div>
                                    <div className="text-xs text-gray-300">Aid a patron or a deity in exchange for a favor, or perform charity for townsfolk.</div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-purple-300">Build</div>
                                    <div className="text-xs text-gray-300">Establish a home base, start a business, craft siege weapons, or build anything else you can imagine (GM and setting-permitting, of course).</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
